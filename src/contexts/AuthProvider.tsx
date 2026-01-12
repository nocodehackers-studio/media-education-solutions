import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { authApi, type User } from '@/features/auth'
import { AuthContext } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Auth provider that manages authentication state via Supabase.
 * Subscribes to auth state changes and fetches user profile.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Fetch user profile from database.
   * If profile is null or fetch fails, sign out to clear the Supabase session.
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await authApi.fetchProfile(userId)

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
    } catch {
      // Network error or other exception - also sign out
      try {
        await supabase.auth.signOut()
      } catch {
        // Ignore signOut errors - we still need to clear local state
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Initialize auth state on mount.
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsLoading(false)
      } else if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery flow - keep loading state
        setIsLoading(false)
      }
      // Note: TOKEN_REFRESHED does not refetch profile - profile data doesn't change on token refresh
    })

    return () => subscription.unsubscribe()
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
