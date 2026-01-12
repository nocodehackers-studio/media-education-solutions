import { createContext, useContext } from 'react'
import type { AuthContextType } from '@/features/auth/types/auth.types'

/**
 * Auth context for managing user authentication state.
 * Must be used within AuthProvider.
 */
export const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Hook to access auth context.
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
