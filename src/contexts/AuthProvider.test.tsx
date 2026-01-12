import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import { authApi } from '@/features/auth'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

vi.mock('@/features/auth', () => ({
  authApi: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    fetchProfile: vi.fn(),
  },
}))

describe('AuthProvider', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    role: 'admin' as const,
    firstName: 'John',
    lastName: 'Doe',
  }

  const mockSubscription = {
    unsubscribe: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock: no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    })
  })

  describe('Initial State', () => {
    it('starts with loading state', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('sets loading to false when no session exists', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('fetches user profile when session exists on mount', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
          } as any,
        },
        error: null,
      })

      vi.mocked(authApi.fetchProfile).mockResolvedValue(mockUser)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(authApi.fetchProfile).toHaveBeenCalledWith('user-123')
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('signIn', () => {
    it('updates user state on successful sign in', async () => {
      vi.mocked(authApi.signIn).mockResolvedValue(mockUser)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Sign in
      await result.current.signIn('admin@example.com', 'password123')

      // Wait for state update
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      expect(authApi.signIn).toHaveBeenCalledWith('admin@example.com', 'password123')
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('sets loading state during sign in', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve
      })

      vi.mocked(authApi.signIn).mockReturnValue(signInPromise as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Start sign in (don't await)
      const signInCall = result.current.signIn('admin@example.com', 'password123')

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve sign in
      resolveSignIn!(mockUser)
      await signInCall

      // Should finish loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('signOut', () => {
    it('clears user state on sign out', async () => {
      // Start with authenticated user
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
          } as any,
        },
        error: null,
      })

      vi.mocked(authApi.fetchProfile).mockResolvedValue(mockUser)
      vi.mocked(authApi.signOut).mockResolvedValue()

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load with user
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Sign out
      await result.current.signOut()

      // Wait for state update
      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      expect(authApi.signOut).toHaveBeenCalled()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('resetPassword', () => {
    it('calls authApi.resetPassword with email', async () => {
      vi.mocked(authApi.resetPassword).mockResolvedValue()

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.resetPassword('user@example.com')

      expect(authApi.resetPassword).toHaveBeenCalledWith('user@example.com')
    })
  })

  describe('Auth State Change Subscription', () => {
    it('handles SIGNED_IN event', async () => {
      let authCallback: any

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      vi.mocked(authApi.fetchProfile).mockResolvedValue(mockUser)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Trigger SIGNED_IN event
      await authCallback('SIGNED_IN', {
        user: { id: 'user-123' },
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      expect(authApi.fetchProfile).toHaveBeenCalledWith('user-123')
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('handles SIGNED_OUT event', async () => {
      let authCallback: any

      // Start with authenticated user
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
          } as any,
        },
        error: null,
      })

      vi.mocked(authApi.fetchProfile).mockResolvedValue(mockUser)

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initial load with user
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Trigger SIGNED_OUT event
      await authCallback('SIGNED_OUT', null)

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(
        () => useAuth(),
        {
          wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        }
      )

      unmount()

      expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    })
  })
})
