import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { useParticipantSession } from '@/contexts'
import { SessionTimeoutWarning } from '@/features/participants'

/**
 * Participant categories page - placeholder for Story 4.3.
 * Shows available categories for submission.
 */
export function ParticipantCategoriesPage() {
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
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Welcome, {session.name || 'Participant'}!</p>
              <p>Contest: {session.contestName}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Category selection coming in Story 4.3...
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
