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
      signOut: vi.fn(),
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
    id: 'mock-subscription',
    callback: vi.fn(),
    unsubscribe: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

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
    it('starts with loading state when no cache exists', () => {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  describe('localStorage Cache', () => {
    it('restores cached profile from localStorage on mount', () => {
      localStorage.setItem(
        'admin_profile_v1',
        JSON.stringify({ user: mockUser, sessionUserId: 'user-123' })
      )

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Synchronous — no waitFor needed
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('caches profile to localStorage on successful sign-in', async () => {
      vi.mocked(authApi.signIn).mockResolvedValue(mockUser)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.signIn('admin@example.com', 'password123')

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      const cached = JSON.parse(localStorage.getItem('admin_profile_v1')!)
      expect(cached).toEqual({ user: mockUser, sessionUserId: 'user-123' })
    })

    it('clears cached profile on sign-out', async () => {
      // Start with cached profile
      localStorage.setItem(
        'admin_profile_v1',
        JSON.stringify({ user: mockUser, sessionUserId: 'user-123' })
      )

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // Starts with cached user
      expect(result.current.user).toEqual(mockUser)

      await result.current.signOut()

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      expect(localStorage.getItem('admin_profile_v1')).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('admin_profile_v1', 'not-valid-json{{{')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Falls back to network path — isLoading starts true
      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBeNull()
    })

    it('clears cache when session is gone', async () => {
      localStorage.setItem(
        'admin_profile_v1',
        JSON.stringify({ user: mockUser, sessionUserId: 'user-123' })
      )

      // No session from Supabase
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Immediately shows cached user
      expect(result.current.user).toEqual(mockUser)

      // After getSession resolves with no session, cache is cleared
      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })

      expect(localStorage.getItem('admin_profile_v1')).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('signIn', () => {
    it('updates user state on successful sign in', async () => {
      vi.mocked(authApi.signIn).mockResolvedValue(mockUser)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.signIn('admin@example.com', 'password123')

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      expect(authApi.signIn).toHaveBeenCalledWith('admin@example.com', 'password123')
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('sets loading state during sign in', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(authApi.signIn).mockReturnValue(signInPromise as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const signInCall = result.current.signIn('admin@example.com', 'password123')

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      resolveSignIn!(mockUser)
      await signInCall

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('signOut', () => {
    it('clears user state on sign out', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      await result.current.signOut()

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let authCallback: any

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

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
