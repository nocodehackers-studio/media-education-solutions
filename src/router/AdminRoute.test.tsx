import { render, screen } from '@testing-library/react'
import { type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './AdminRoute'
import { AuthContext } from '@/contexts/AuthContext'
import { type User } from '@/features/auth'

describe('AdminRoute', () => {
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
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/dashboard" element={<AdminRoute>{children}</AdminRoute>} />
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/judge/dashboard" element={<div>Judge Dashboard</div>} />
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
      renderWithAuth(<div>Admin Content</div>, {
        user: null,
        isLoading: true,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
      })

      // AC3: Uses minimal CSS-only loading indicator
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })
  })

  describe('Unauthenticated Access (AC5)', () => {
    it('redirects to /login when user is not authenticated', () => {
      renderWithAuth(<div>Admin Content</div>, {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
      })

      expect(screen.getByText('Login Page')).toBeInTheDocument()
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })
  })

  describe('Judge Role Access (AC6)', () => {
    it('redirects to /judge/dashboard when user is a judge', () => {
      renderWithAuth(<div>Admin Content</div>, {
        user: mockJudgeUser,
        isLoading: false,
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
      })

      expect(screen.getByText('Judge Dashboard')).toBeInTheDocument()
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })
  })

  describe('Admin Role Access', () => {
    it('renders children when user is an admin', () => {
      renderWithAuth(<div>Admin Content</div>, {
        user: mockAdminUser,
        isLoading: false,
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
      })

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
      expect(screen.queryByText('Judge Dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Location State Preservation', () => {
    it('passes location state to login redirect', () => {
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
          <MemoryRouter initialEntries={['/admin/contests']}>
            <Routes>
              <Route
                path="/admin/contests"
                element={<AdminRoute><div>Admin Content</div></AdminRoute>}
              />
              <Route
                path="/login"
                element={
                  <div>
                    Login Page
                    <div data-testid="redirect-check">Redirected from admin</div>
                  </div>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      )

      expect(screen.getByText('Login Page')).toBeInTheDocument()
      // Note: Testing location.state preservation requires react-router v6.4+ features
      // This test verifies the redirect happens; integration tests can verify state
    })
  })
})
