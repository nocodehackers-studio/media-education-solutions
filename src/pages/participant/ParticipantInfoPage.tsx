import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import {
  ParticipantInfoForm,
  useParticipant,
  type ParticipantInfoFormData,
} from '@/features/participants'
import { useParticipantSession } from '@/contexts'
import { SessionTimeoutWarning } from '@/features/participants'
import { supabase } from '@/lib/supabase'

/**
 * Participant info page - collects name, organization, and teacher/leader/coach info.
 * Story 4.2: Participant Info Form
 */
export function ParticipantInfoPage() {
  const navigate = useNavigate()
  const {
    session,
    endSession,
    showWarning,
    extendSession,
    updateParticipantInfo,
  } = useParticipantSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch existing participant data using TanStack Query (AC2: pre-fill for returning users)
  const queryParams = useMemo(
    () =>
      session
        ? {
            participantId: session.participantId,
            participantCode: session.code,
            contestId: session.contestId,
          }
        : null,
    [session]
  )
  const { data: participant, isLoading: isFetching } =
    useParticipant(queryParams)

  // Transform participant data to form default values
  const defaultValues = useMemo<Partial<ParticipantInfoFormData> | undefined>(
    () =>
      participant
        ? {
            name: participant.name || '',
            organizationName: participant.organizationName || '',
            tlcName: participant.tlcName || '',
            tlcEmail: participant.tlcEmail || '',
          }
        : undefined,
    [participant]
  )

  const handleLogout = () => {
    endSession()
    navigate('/enter', { replace: true })
  }

  const handleSubmit = async (data: ParticipantInfoFormData) => {
    if (!session) {
      toast.error('Session expired. Please enter your codes again.')
      navigate('/enter', { replace: true })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'update-participant',
        {
          body: {
            participantId: session.participantId,
            participantCode: session.code,
            contestId: session.contestId,
            ...data,
          },
        }
      )

      if (error || !result?.success) {
        throw new Error(
          result?.error || error?.message || 'Failed to save information'
        )
      }

      // Update session context with new data (AC6: persists for future submissions)
      updateParticipantInfo({
        name: data.name,
        organizationName: data.organizationName,
        tlcName: data.tlcName,
        tlcEmail: data.tlcEmail,
      })

      toast.success('Information saved!')
      navigate('/participant/categories', { replace: true })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save information'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while fetching existing data
  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Redirect if no session
  if (!session) {
    return null
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Your Information</CardTitle>
            <CardDescription>
              {session.contestName && `Submitting to: ${session.contestName}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ParticipantInfoForm
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>

      <SessionTimeoutWarning
        open={showWarning}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
    </>
  )
}
