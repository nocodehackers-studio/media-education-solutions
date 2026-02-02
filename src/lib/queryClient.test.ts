import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}))

import { isAuthError } from './queryClient'

describe('isAuthError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false for null/undefined', () => {
    expect(isAuthError(null)).toBe(false)
    expect(isAuthError(undefined)).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isAuthError('string')).toBe(false)
    expect(isAuthError(42)).toBe(false)
  })

  it('returns true for status 401', () => {
    expect(isAuthError({ status: 401 })).toBe(true)
  })

  it('returns false for status 403 (authorization, not authentication)', () => {
    expect(isAuthError({ status: 403 })).toBe(false)
  })

  it('returns false for status 500', () => {
    expect(isAuthError({ status: 500 })).toBe(false)
  })

  it('returns true for PGRST301 code', () => {
    expect(isAuthError({ code: 'PGRST301' })).toBe(true)
  })

  it('returns true for jwt expired message', () => {
    expect(isAuthError({ message: 'JWT expired' })).toBe(true)
  })

  it('returns true for invalid jwt message', () => {
    expect(isAuthError({ message: 'Invalid JWT token' })).toBe(true)
  })

  it('returns true for refresh_token_not_found message', () => {
    expect(isAuthError({ message: 'refresh_token_not_found' })).toBe(true)
  })

  it('returns true for not authenticated message', () => {
    expect(isAuthError({ message: 'User is not authenticated' })).toBe(true)
  })

  it('is case-insensitive for message matching', () => {
    expect(isAuthError({ message: 'JWT EXPIRED' })).toBe(true)
    expect(isAuthError({ message: 'jwt expired' })).toBe(true)
  })

  it('returns false for generic errors', () => {
    expect(isAuthError({ message: 'Network error' })).toBe(false)
    expect(isAuthError(new Error('Something went wrong'))).toBe(false)
  })

  it('returns false for empty objects', () => {
    expect(isAuthError({})).toBe(false)
  })
})
