import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from '@/components/ui'
import { CodeEntryForm, type CodeEntryFormData } from '@/features/participants'
import { useParticipantSession } from '@/contexts'
import { ERROR_MESSAGES } from '@/lib/errorCodes'

/**
 * Participant code entry page.
 * Allows participants to enter contest using contest code + participant code.
 * Redirects authenticated participants to participant info page.
 */
export function CodeEntryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { enterContest, isAuthenticated, isLoading: contextLoading } =
    useParticipantSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check for session expired message in location state
  useEffect(() => {
    const state = location.state as { expired?: boolean } | null
    if (state?.expired) {
      toast.error('Session expired. Please enter your codes again.')
      // Clear the state to prevent showing message again on refresh
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  // Redirect if already authenticated
  useEffect(() => {
    if (!contextLoading && isAuthenticated) {
      navigate('/participant/categories', { replace: true })
    }
  }, [isAuthenticated, contextLoading, navigate])

  const handleSubmit = async (data: CodeEntryFormData) => {
    setIsSubmitting(true)
    try {
      await enterContest(data.contestCode, data.participantCode)
      toast.success('Welcome! Choose a category to submit your work.')
      navigate('/participant/categories', { replace: true })
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'Unknown error'

      // Map error codes to user-friendly messages (fallback for unknown codes)
      const userMessage =
        ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] ||
        'Something went wrong. Please try again.'

      toast.error(userMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render form if already authenticated (prevents flash)
  if (contextLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            Enter Contest
          </CardTitle>
          <CardDescription>
            Enter your contest code and participant code to submit your work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeEntryForm onSubmit={handleSubmit} isLoading={isSubmitting} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Your codes were provided by your teacher or organization.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
