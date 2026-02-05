import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from '@/components/ui'
import { LoginForm, type LoginFormData } from '@/features/auth'
import { useAuth } from '@/contexts'

/**
 * Login page for admin and judge users.
 * Redirects authenticated users based on their role.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isAuthenticated, user, isLoading } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname

      // Redirect based on role
      if (user.role === 'admin') {
        navigate(from || '/admin/dashboard', { replace: true })
      } else if (user.role === 'judge') {
        navigate('/judge/dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, user, isLoading, navigate, location.state])

  const handleSubmit = async (data: LoginFormData, turnstileToken: string) => {
    try {
      await signIn(data.email, data.password, turnstileToken)
      toast.success('Welcome back!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid email or password')
    }
  }

  // Don't render form if already authenticated (prevents flash)
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="h-8 w-48 mx-auto bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 mx-auto bg-muted animate-pulse rounded" />
          <div className="space-y-3 pt-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            Media Education Solutions
          </CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={handleSubmit} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account? Contact your administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
