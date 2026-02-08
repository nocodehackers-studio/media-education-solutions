/**
 * Auth types for Admin/Judge authentication.
 * Aligns with Supabase profiles table schema.
 */

/** User roles in the system */
export type UserRole = 'admin' | 'judge'

/** User profile from profiles table */
export interface User {
  id: string
  email: string
  role: UserRole
  firstName: string | null
  lastName: string | null
}

/** Auth state for the context */
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

/** Auth context type with methods */
export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string, turnstileToken: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

/** Sign in credentials */
export interface SignInCredentials {
  email: string
  password: string
}

/** Reset password request */
export interface ResetPasswordRequest {
  email: string
}

/** Set new password request */
export interface SetNewPasswordRequest {
  password: string
  confirmPassword: string
}
