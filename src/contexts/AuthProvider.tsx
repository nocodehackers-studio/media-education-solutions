import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { authApi } from '@/features/auth/api/authApi'
import type { User } from '@/features/auth/types/auth.types'
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

  const isAuthenticated = useMemo(() => user !== null, [user])

  /**
   * Fetch user profile from database.
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await authApi.fetchProfile(userId)
      setUser(profile)
    } catch {
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
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Refresh profile on token refresh
        await fetchUserProfile(session.user.id)
      } else if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery flow - keep loading state
        setIsLoading(false)
      }
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
      isAuthenticated,
      signIn,
      signOut,
      resetPassword,
    }),
    [user, isLoading, isAuthenticated, signIn, signOut, resetPassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
