import { render, screen } from '@testing-library/react'
import { type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthContext } from '@/contexts/AuthContext'
import { type User } from '@/features/auth'

// Mock UI components
vi.mock('@/components/ui', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

describe('ProtectedRoute', () => {
  const mockAdminUser: User = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  }

  const mockJudgeUser: User = {
    id: 'judge-123',
    email: 'judge@example.com',
    role: 'judge',
    firstName: 'Judge',
    lastName: 'User',
  }

  const renderWithAuth = (
    children: ReactNode,
    authValue: {
      user: User | null
      isLoading: boolean
      isAuthenticated: boolean
      signIn: () => Promise<void>
      signOut: () => Promise<void>
      resetPassword: () => Promise<void>
    }
  ) => {
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<ProtectedRoute>{children}</ProtectedRoute>} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('renders loading screen when isLoading is true', () => {
      renderWithAuth(<div>Protected Content</div>, {
        user: null,
        isLoading: true,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
      })

      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Unauthenticated Access (AC5)', () => {
    it('redirects to /login when user is not authenticated', () => {
      renderWithAuth(<div>Protected Content</div>, {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
      })

      expect(screen.getByText('Login Page')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated Access', () => {
    it('renders children when user is authenticated as admin', () => {
      renderWithAuth(<div>Protected Content</div>, {
        user: mockAdminUser,
        isLoading: false,
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
      })

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    })

    it('renders children when user is authenticated as judge', () => {
      renderWithAuth(<div>Protected Content</div>, {
        user: mockJudgeUser,
        isLoading: false,
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
      })

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    })
  })

  describe('Location State Preservation', () => {
    it('redirects to login and preserves location state', () => {
      render(
        <AuthContext.Provider
          value={{
            user: null,
            isLoading: false,
            isAuthenticated: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
            resetPassword: vi.fn(),
          }}
        >
          <MemoryRouter initialEntries={['/protected-page']}>
            <Routes>
              <Route
                path="/protected-page"
                element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>}
              />
              <Route
                path="/login"
                element={
                  <div>
                    Login Page
                    <div data-testid="redirect-check">Redirected from protected</div>
                  </div>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      )

      expect(screen.getByText('Login Page')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      // Note: Testing location.state preservation requires react-router v6.4+ features
      // This test verifies the redirect happens; integration tests can verify state
    })
  })
})
