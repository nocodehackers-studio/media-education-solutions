import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminSidebar } from './AdminSidebar'
import { AuthContext } from '@/contexts/AuthContext'
import type { AuthContextType, User } from '@/features/auth'

// Mock user for testing
const mockUser: User = {
  id: '123',
  email: 'admin@example.com',
  role: 'admin',
  firstName: 'Test',
  lastName: 'Admin',
}

const mockSignOut = vi.fn()

const mockAuthContext: AuthContextType = {
  user: mockUser,
  isLoading: false,
  isAuthenticated: true,
  signIn: vi.fn(),
  signOut: mockSignOut,
  resetPassword: vi.fn(),
}

function renderWithProviders(ui: React.ReactElement, initialPath = '/admin/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthContext.Provider value={mockAuthContext}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Dashboard and Contests nav links', () => {
    renderWithProviders(<AdminSidebar />)

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contests/i })).toBeInTheDocument()
  })

  it('displays Dashboard link with correct href', () => {
    renderWithProviders(<AdminSidebar />)

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveAttribute('href', '/admin/dashboard')
  })

  it('displays Contests link with correct href', () => {
    renderWithProviders(<AdminSidebar />)

    const contestsLink = screen.getByRole('link', { name: /contests/i })
    expect(contestsLink).toHaveAttribute('href', '/admin/contests')
  })

  it('shows user email in profile section', () => {
    renderWithProviders(<AdminSidebar />)

    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('shows user first name if available', () => {
    renderWithProviders(<AdminSidebar />)

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('shows logout button', () => {
    renderWithProviders(<AdminSidebar />)

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('calls signOut when logout button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminSidebar />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('shows initials in avatar', () => {
    renderWithProviders(<AdminSidebar />)

    // Should show first two letters of email (AD)
    expect(screen.getByText('AD')).toBeInTheDocument()
  })

  it('applies active styling to current route', () => {
    renderWithProviders(<AdminSidebar />, '/admin/dashboard')

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('bg-accent')
  })
})
