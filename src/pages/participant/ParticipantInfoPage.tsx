import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { useParticipantSession } from '@/contexts'
import { SessionTimeoutWarning } from '@/features/participants'

/**
 * Participant info page - placeholder for Story 4.2.
 * Currently shows session info and allows logout.
 */
export function ParticipantInfoPage() {
  const navigate = useNavigate()
  const { session, endSession, showWarning, extendSession } =
    useParticipantSession()

  const handleLogout = () => {
    endSession()
    navigate('/enter', { replace: true })
  }

  if (!session) {
    return null
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to {session.contestName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Participant Code: {session.code}</p>
              <p>Contest Code: {session.contestCode}</p>
              {session.name && <p>Name: {session.name}</p>}
              {session.organizationName && (
                <p>Organization: {session.organizationName}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Participant info form coming in Story 4.2...
            </p>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Log Out
            </Button>
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
