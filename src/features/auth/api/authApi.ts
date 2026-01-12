import { supabase } from '@/lib/supabase'
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

/**
 * Sign in with email and password.
 * Returns user profile on success.
 * @throws Error with "Invalid email or password" on failure
 */
export async function signIn(
  email: string,
  password: string
): Promise<User> {
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (authError) {
    throw new Error('Invalid email or password')
  }

  if (!authData.user) {
    throw new Error('Invalid email or password')
  }

  // Fetch profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    // Sign out if profile not found (shouldn't happen)
    await supabase.auth.signOut()
    throw new Error('Invalid email or password')
  }

  return transformProfile(profile)
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error('Failed to sign out')
  }
}

/**
 * Send password reset email.
 * @throws Error if failed to send
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    throw new Error('Failed to send password reset email')
  }
}

/**
 * Update password after reset.
 * @throws Error if failed to update
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error('Failed to update password')
  }
}

/**
 * Fetch user profile by ID.
 * Used by AuthProvider to get profile after auth state change.
 */
export async function fetchProfile(userId: string): Promise<User | null> {
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
 * Get the current session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export const authApi = {
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  fetchProfile,
  getSession,
}
