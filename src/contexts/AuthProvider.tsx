import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { authApi, type User } from '@/features/auth'
import { AuthContext } from './AuthContext'
import { queryClient, PROFILE_STORAGE_KEY } from '@/lib/queryClient'
import { getErrorMessage, ERROR_CODES } from '@/lib/errorCodes'

interface AuthProviderProps {
  children: ReactNode
}
// Profile fetch can take longer, but UI must be responsive
const PROFILE_FETCH_TIMEOUT = 5000

/**
 * Read cached profile from localStorage synchronously.
 * Returns { user, sessionUserId } or null on any error.
 */
function getCachedProfile(): { user: User; sessionUserId: string } | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed?.user &&
      typeof parsed.user.id === 'string' &&
      typeof parsed.user.email === 'string' &&
      typeof parsed.user.role === 'string' &&
      typeof parsed.sessionUserId === 'string'
    ) {
      return { user: parsed.user as User, sessionUserId: parsed.sessionUserId }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Write profile + sessionUserId to localStorage, or remove the key if user is null.
 */
function cacheProfile(user: User | null, sessionUserId: string | null) {
  if (user && sessionUserId) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ user, sessionUserId }))
  } else {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
  }
}

/**
 * Auth provider that manages authentication state via Supabase.
 * Subscribes to auth state changes and fetches user profile.
 *
 * Key patterns:
 * - Cached profile restores synchronously from localStorage (ParticipantSessionProvider pattern)
 * - isAuthenticated is based on SESSION existence, not PROFILE
 * - Background token validation — non-blocking UI
 * - Global auth error handler in queryClient catches expired sessions
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const initialCachedRef = useRef(getCachedProfile())

  const [user, setUser] = useState<User | null>(initialCachedRef.current?.user ?? null)
  const [isLoading, setIsLoading] = useState(!initialCachedRef.current)
  const [sessionUserId, setSessionUserId] = useState<string | null>(initialCachedRef.current?.sessionUserId ?? null)
  const mountedRef = useRef(true)
  const sessionUserIdRef = useRef<string | null>(initialCachedRef.current?.sessionUserId ?? null)

  /**
   * Fetch user profile from database with timeout.
   * When a cached profile exists and the fetch times out, keep the cached user
   * visible (F2 fix) — only sign out on timeout when there is NO cached profile.
   */
  const fetchUserProfile = useCallback(async (userId: string, hasCachedProfile: boolean) => {
    try {
      const profilePromise = authApi.fetchProfile(userId)
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_FETCH_TIMEOUT)
      })

      const profile = await Promise.race([profilePromise, timeoutPromise])

      // Guard: if signed out while fetch was in-flight, discard result
      if (!mountedRef.current || sessionUserIdRef.current !== userId) return

      if (!profile) {
        // Profile doesn't exist in DB — sign out
        cacheProfile(null, null)
        try {
          await supabase.auth.signOut()
        } catch {
          // Ignore signOut errors
        }
        setUser(null)
        setSessionUserId(null)
        sessionUserIdRef.current = null
        setIsLoading(false)
        return
      }

      setUser(profile)
      cacheProfile(profile, userId)
    } catch (error) {
      if (mountedRef.current) {
        if (hasCachedProfile) {
          // F2 fix: keep cached user visible on timeout, just log warning
          console.warn('Background profile revalidation failed:', error)
        } else {
          // No cache — clear user so loading resolves to unauthenticated
          setUser(null)
          console.error('Failed to fetch user profile:', error)
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  /**
   * Initialize auth state on mount.
   * If cached profile exists, isLoading starts false and UI renders immediately.
   * Background getSession() + fetchUserProfile() still runs to revalidate.
   */
  useEffect(() => {
    mountedRef.current = true
    const hasCachedProfile = !!initialCachedRef.current
    let loadingResolved = hasCachedProfile // If cache exists, loading is already false

    const resolveLoading = () => {
      if (!loadingResolved) {
        loadingResolved = true
        setIsLoading(false)
      }
    }

    // Get initial session with proper error handling
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
          // Guard: if signOut ran between effect start and getSession resolution,
          // sessionUserIdRef was cleared to null. Don't re-authenticate.
          if (hasCachedProfile && sessionUserIdRef.current === null) return

          setSessionUserId(session.user.id)
          sessionUserIdRef.current = session.user.id
          fetchUserProfile(session.user.id, hasCachedProfile)
        } else {
          // F4/F8 fix: No session exists — clear stale cache if present
          if (hasCachedProfile) {
            cacheProfile(null, null)
            setUser(null)
            setSessionUserId(null)
            sessionUserIdRef.current = null
          }
          resolveLoading()
        }
      })
      .catch((error) => {
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

      if (event === 'INITIAL_SESSION') {
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Skip redundant events for the same user (token refresh fires SIGNED_IN)
        if (session.user.id === sessionUserIdRef.current) return

        setSessionUserId(session.user.id)
        sessionUserIdRef.current = session.user.id
        await fetchUserProfile(session.user.id, false)
      } else if (event === 'SIGNED_OUT') {
        cacheProfile(null, null)
        setUser(null)
        setSessionUserId(null)
        sessionUserIdRef.current = null
        setIsLoading(false)
      } else if (event === 'PASSWORD_RECOVERY') {
        setIsLoading(false)
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed - no action needed
      }
    })

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const signIn = useCallback(async (email: string, password: string, turnstileToken: string) => {
    setIsLoading(true)
    try {
      const { user: profile, accessToken, refreshToken } = await authApi.signIn(email, password, turnstileToken)
      // Set ref BEFORE setSession to prevent onAuthStateChange from double-processing
      setSessionUserId(profile.id)
      sessionUserIdRef.current = profile.id
      setUser(profile)
      cacheProfile(profile, profile.id)
      // Establish Supabase session on client (onAuthStateChange SIGNED_IN will be skipped via guard)
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      // If setSession fails, rollback state to prevent inconsistent auth
      if (sessionError) {
        console.error('Failed to establish session:', sessionError)
        setUser(null)
        setSessionUserId(null)
        sessionUserIdRef.current = null
        cacheProfile(null, null)
        throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    cacheProfile(null, null)
    queryClient.clear()
    setUser(null)
    setSessionUserId(null)
    sessionUserIdRef.current = null
    try {
      await authApi.signOut()
    } catch {
      // API sign-out failed, but local state is already cleared
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await authApi.resetPassword(email)
  }, [])

  const refreshProfile = useCallback(async () => {
    const userId = sessionUserIdRef.current
    if (!userId) return
    const profile = await authApi.fetchProfile(userId)
    if (profile && mountedRef.current) {
      setUser(profile)
      cacheProfile(profile, userId)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: sessionUserId !== null,
      signIn,
      signOut,
      resetPassword,
      refreshProfile,
    }),
    [user, isLoading, sessionUserId, signIn, signOut, resetPassword, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
