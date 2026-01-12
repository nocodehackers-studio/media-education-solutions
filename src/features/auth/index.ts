// features/auth/index.ts
// Auth feature - Admin/Judge login, session management

// === Components ===
export { LoginForm } from './components/LoginForm'
export { ForgotPasswordForm } from './components/ForgotPasswordForm'

// === Hooks ===
// useAuth is exported from contexts, not here

// === API ===
export { authApi } from './api/authApi'

// === Types ===
export type {
  User,
  UserRole,
  AuthState,
  AuthContextType,
  SignInCredentials,
  ResetPasswordRequest,
  SetNewPasswordRequest,
} from './types/auth.types'

// === Schemas ===
export {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './types/auth.schemas'
export type {
  LoginFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from './types/auth.schemas'
