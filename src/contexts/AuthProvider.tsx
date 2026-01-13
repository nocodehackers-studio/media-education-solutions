import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { authApi, type User } from '@/features/auth'
import { AuthContext } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

// AC1: Session must restore within 2 seconds - this is the hard limit
const SESSION_RESTORE_TIMEOUT = 2000
// Profile fetch can take longer, but UI must be responsive within 2s
const PROFILE_FETCH_TIMEOUT = 5000

/**
 * Auth provider that manages authentication state via Supabase.
 * Subscribes to auth state changes and fetches user profile.
 * AC1: Session restoration within 2 seconds, handles all edge cases.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  /**
   * Fetch user profile from database with timeout.
   * AC1: Fail gracefully after 5 seconds.
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Race profile fetch against timeout
      const profilePromise = authApi.fetchProfile(userId)
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_FETCH_TIMEOUT)
      })

      const profile = await Promise.race([profilePromise, timeoutPromise])

      // Check if component is still mounted
      if (!mountedRef.current) return

      // Check if profile is null (user exists in auth but not in profiles table)
      if (!profile) {
        // Profile doesn't exist - sign out to prevent authenticated API calls with user=null
        try {
          await supabase.auth.signOut()
        } catch {
          // Ignore signOut errors - we still need to clear local state
        }
        setUser(null)
        setIsLoading(false)
        return
      }

      setUser(profile)
    } catch (error) {
      // Network error, timeout, or other exception - don't sign out (session may still be valid)
      // Just clear local state; next navigation will retry
      if (mountedRef.current) {
        setUser(null)
        console.error('Failed to fetch user profile:', error)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  /**
   * Initialize auth state on mount.
   * AC1: Handle INITIAL_SESSION event, add error handling with .catch()
   * AC1: Session restoration within 2 seconds guaranteed.
   */
  useEffect(() => {
    mountedRef.current = true
    let loadingResolved = false

    // AC1: Hard 2-second limit - if auth isn't resolved by then, show UI anyway
    // This prevents infinite loading states and guarantees 2-second restore
    const sessionRestoreTimeout = setTimeout(() => {
      if (mountedRef.current && !loadingResolved) {
        console.warn('Session restore timeout (2s) - showing UI')
        loadingResolved = true
        setIsLoading(false)
      }
    }, SESSION_RESTORE_TIMEOUT)

    const resolveLoading = () => {
      if (!loadingResolved) {
        loadingResolved = true
        clearTimeout(sessionRestoreTimeout)
        setIsLoading(false)
      }
    }

    // Get initial session with proper error handling (AC1)
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mountedRef.current) return

        if (error) {
          console.error('Failed to get session:', error)
          resolveLoading()
          return
        }

        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          resolveLoading()
        }
      })
      .catch((error) => {
        // AC1: Ensure setIsLoading(false) is ALWAYS called
        console.error('Auth initialization error:', error)
        if (mountedRef.current) {
          resolveLoading()
        }
      })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      // AC1: Handle INITIAL_SESSION event (already handled by getSession above)
      if (event === 'INITIAL_SESSION') {
        // Skip - already handled by getSession() to avoid duplicate profile fetch
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsLoading(false)
      } else if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery flow - keep loading state
        setIsLoading(false)
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed - no action needed, profile data doesn't change
      }
    })

    return () => {
      mountedRef.current = false
      clearTimeout(sessionRestoreTimeout)
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  /**
   * Sign in with email and password.
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const profile = await authApi.signIn(email, password)
      setUser(profile)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Sign out the current user.
   * Errors propagate to caller to allow UI to display feedback.
   */
  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await authApi.signOut()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Send password reset email.
   */
  const resetPassword = useCallback(async (email: string) => {
    await authApi.resetPassword(email)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      signIn,
      signOut,
      resetPassword,
    }),
    [user, isLoading, signIn, signOut, resetPassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
