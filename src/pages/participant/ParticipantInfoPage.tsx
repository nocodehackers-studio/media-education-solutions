import { useState, useEffect } from 'react'
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
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [defaultValues, setDefaultValues] =
    useState<Partial<ParticipantInfoFormData>>()

  const handleLogout = () => {
    endSession()
    navigate('/enter', { replace: true })
  }

  // Fetch existing participant data on mount (for returning participants - AC2)
  useEffect(() => {
    async function fetchParticipantData() {
      if (!session) {
        setIsFetching(false)
        return
      }

      try {
        const { data, error } = await supabase.functions.invoke(
          'get-participant',
          {
            body: {
              participantId: session.participantId,
              participantCode: session.code,
              contestId: session.contestId,
            },
          }
        )

        if (!error && data?.success && data.participant) {
          setDefaultValues({
            name: data.participant.name || '',
            organizationName: data.participant.organizationName || '',
            tlcName: data.participant.tlcName || '',
            tlcEmail: data.participant.tlcEmail || '',
          })
        }
      } catch {
        // First-time user or fetch failed - show empty form (AC1)
        console.log('No existing participant data found')
      } finally {
        setIsFetching(false)
      }
    }

    fetchParticipantData()
  }, [session])

  const handleSubmit = async (data: ParticipantInfoFormData) => {
    if (!session) {
      toast.error('Session expired. Please enter your codes again.')
      navigate('/enter', { replace: true })
      return
    }

    setIsLoading(true)
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
      setIsLoading(false)
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
              isLoading={isLoading}
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
