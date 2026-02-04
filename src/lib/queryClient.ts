import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { supabase } from '@/lib/supabase'

export const PROFILE_STORAGE_KEY = 'admin_profile_v1'

/**
 * Detect Supabase auth errors (expired JWT, invalid token, etc.)
 * Does NOT include 403 — that's authorization (valid session, wrong role).
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const err = error as Record<string, unknown>

  // Check HTTP status
  if (err.status === 401) return true

  // Check Supabase-specific error code for JWT issues
  if (err.code === 'PGRST301') return true

  // Check error message patterns
  const message = typeof err.message === 'string' ? err.message.toLowerCase() : ''
  if (
    message.includes('jwt expired') ||
    message.includes('invalid jwt') ||
    message.includes('refresh_token_not_found') ||
    message.includes('not authenticated')
  ) {
    return true
  }

  return false
}

let isRedirecting = false

/**
 * Handle auth errors: clear all auth state and hard-redirect to login.
 * Hard navigate fully resets React tree — correct behavior for expired sessions.
 * Debounce guard prevents multiple concurrent query/mutation errors from
 * triggering duplicate redirects.
 */
function handleAuthError() {
  if (isRedirecting) return
  isRedirecting = true
  // Clear React Query cache to prevent stale data leaking across sessions
  queryClient.clear()
  // Clear Supabase's own auth tokens (sb-*-auth-token keys)
  supabase.auth.signOut().catch(() => {})
  // Clear cached admin profile
  localStorage.removeItem(PROFILE_STORAGE_KEY)
  // Hard navigate to reset React tree
  window.location.href = '/login'
}

export const sessionPersister = createSyncStoragePersister({
  storage: window.sessionStorage,
})

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isAuthError(error)) handleAuthError()
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isAuthError(error)) handleAuthError()
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 30,
      // F5 fix: short-circuit retries on auth errors
      retry: (failureCount, error) => {
        if (isAuthError(error)) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isAuthError(error)) return false
        return failureCount < 1
      },
    },
  },
})
