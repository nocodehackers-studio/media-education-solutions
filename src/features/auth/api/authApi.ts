import { supabase } from '@/lib/supabase'
import { getErrorMessage, ERROR_CODES } from '@/lib/errorCodes'
import type { User } from '../types/auth.types'

/**
 * Transform database profile (snake_case) to User type (camelCase).
 */
function transformProfile(profile: {
  id: string
  email: string
  role: 'admin' | 'judge'
  first_name: string | null
  last_name: string | null
}): User {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
  }
}

interface SignInResult {
  user: User
  accessToken: string
  refreshToken: string
}

/**
 * Sign in with email and password via server-side edge function.
 * Turnstile token is verified server-side before auth proceeds.
 * Returns user profile + session tokens on success.
 * @throws Error with user-friendly message on failure
 */
async function signIn(
  email: string,
  password: string,
  turnstileToken: string,
): Promise<SignInResult> {
  const { data, error } = await supabase.functions.invoke('verify-admin-login', {
    body: { email, password, turnstileToken },
  })

  // supabase.functions.invoke sets error for non-2xx responses.
  // The error.context (a Response object) contains the JSON body with our error code.
  if (error) {
    let errorCode = 'SERVER_ERROR'
    try {
      const errorBody = await (error as { context?: Response }).context?.json()
      if (errorBody?.error) errorCode = errorBody.error
    } catch {
      // JSON parse failed, fall through to SERVER_ERROR
    }
    if (errorCode === 'AUTH_INVALID_CREDENTIALS') {
      throw new Error(getErrorMessage(ERROR_CODES.AUTH_INVALID_CREDENTIALS))
    } else if (errorCode === 'TURNSTILE_FAILED') {
      throw new Error(getErrorMessage(ERROR_CODES.TURNSTILE_FAILED))
    } else if (errorCode === 'EMAIL_NOT_CONFIRMED') {
      throw new Error('Please verify your email address before signing in.')
    } else {
      throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
    }
  }

  if (!data?.user || !data?.access_token || !data?.refresh_token) {
    throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
  }

  return {
    user: transformProfile(data.user),
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}

/**
 * Sign out the current user.
 */
async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * Send password reset email.
 * @throws Error if failed to send
 */
async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * Update password after reset.
 * @throws Error if failed to update
 */
async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * Fetch user profile by ID.
 * Used by AuthProvider to get profile after auth state change.
 */
async function fetchProfile(userId: string): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  return transformProfile(profile)
}

/**
 * Update user profile (first name, last name).
 * RLS allows self-update; protect_profile_columns() trigger blocks role/email/id changes.
 */
async function updateProfile(userId: string, updates: { firstName: string; lastName: string }): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ first_name: updates.firstName, last_name: updates.lastName })
    .eq('id', userId)

  if (error) {
    throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * Get the current session.
 * Returns null if not authenticated.
 */
async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export const authApi = {
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  updateProfile,
  fetchProfile,
  getSession,
}
