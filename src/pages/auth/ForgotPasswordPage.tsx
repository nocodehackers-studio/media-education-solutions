import { Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from '@/components/ui'
import { ForgotPasswordForm, type ForgotPasswordFormData } from '@/features/auth'
import { useAuth } from '@/contexts'

/**
 * Forgot password page for requesting password reset.
 */
export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await resetPassword(data.email)
      // Success handled in form component
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email')
      throw error // Re-throw to prevent success state in form
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            Reset your password
          </CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
