import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Video,
  Image,
  CheckCircle,
  Clock,
  ChevronRight,
  Inbox,
} from 'lucide-react'
import { Badge, Button, Card, CardContent } from '@/components/ui'
import {
  useParticipantCategories,
  type ParticipantCategory,
} from '@/features/participants'
import { useParticipantSession } from '@/contexts'

interface SubmittedCategory extends ParticipantCategory {
  divisionName: string
}

export function ParticipantSubmissionsPage() {
  const navigate = useNavigate()
  const { session } = useParticipantSession()

  const { data } = useParticipantCategories({
    contestId: session?.contestId || '',
    participantId: session?.participantId || '',
    participantCode: session?.code || '',
  })

  const submissions: SubmittedCategory[] = (data?.divisions || []).flatMap(
    (division) =>
      division.categories
        .filter((c) => c.hasSubmitted && c.submissionId)
        .map((c) => ({ ...c, divisionName: division.name }))
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Header */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/participant/categories')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">My Submissions</h1>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                You haven't submitted anything yet.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/participant/categories')}
              >
                Browse Categories
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {submissions.map((item) => {
              const TypeIcon = item.type === 'video' ? Video : Image
              return (
                <Card
                  key={item.submissionId}
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() =>
                    navigate(`/participant/preview/${item.submissionId}`)
                  }
                >
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <TypeIcon className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.divisionName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.submissionStatus === 'submitted' ? (
                          <Badge
                            variant="default"
                            className="bg-green-600 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="bg-amber-500 text-xs"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
