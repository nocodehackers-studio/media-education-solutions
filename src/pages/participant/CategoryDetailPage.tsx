import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Video,
  Image,
  CheckCircle,
  Clock,
  ChevronRight,
  Lock,
} from 'lucide-react'
import {
  Button,
  Badge,
  Card,
  CardContent,
  Separator,
} from '@/components/ui'
import {
  DeadlineCountdown,
  useParticipantCategories,
  type ParticipantCategory,
} from '@/features/participants'
import { useParticipantSession } from '@/contexts'

interface LocationState {
  category?: ParticipantCategory
  contestFinished?: boolean
}

/**
 * Category detail page — shows full category info (description, rules, deadline)
 * and submission action (submit, view, or feedback).
 */
export function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useParticipantSession()

  const state = location.state as LocationState | null

  // Try to get category from router state first, then fall back to React Query cache
  const { data: cachedData } = useParticipantCategories({
    contestId: session?.contestId || '',
    participantId: session?.participantId || '',
    participantCode: session?.code || '',
  })

  const category: ParticipantCategory | undefined =
    state?.category ??
    cachedData?.categories.find((c) => c.id === categoryId)

  const contestFinished =
    state?.contestFinished ?? cachedData?.contestStatus === 'finished'

  const handleBack = () => {
    navigate('/participant/categories')
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">Category not found</p>
              <Button variant="outline" onClick={handleBack}>
                Back to Categories
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isClosed = category.status === 'closed'
  const isDisabled = contestFinished && category.noSubmission
  const TypeIcon = category.type === 'video' ? Video : Image
  const typeLabel = category.type === 'video' ? 'Video' : 'Photo'

  const handleSubmit = () => {
    navigate(`/participant/submit/${category.id}`, {
      state: { type: category.type },
    })
  }

  const handleViewSubmission = () => {
    if (category.submissionId) {
      navigate(`/participant/preview/${category.submissionId}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {/* Category header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TypeIcon className="h-4 w-4" />
            <span className="text-sm">{typeLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">{category.name}</h1>

          {/* Deadline */}
          {!contestFinished && !isClosed && (
            <DeadlineCountdown deadline={category.deadline} className="text-base" />
          )}
          {!contestFinished && isClosed && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Submissions closed</span>
            </div>
          )}
          {contestFinished && (
            <span className="text-muted-foreground">Contest ended</span>
          )}
        </div>

        {/* About section */}
        {category.description && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About
            </h2>
            <p className="text-sm whitespace-pre-line">{category.description}</p>
          </div>
        )}

        {/* Rules section */}
        {category.rules && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Rules
            </h2>
            <p className="text-sm whitespace-pre-line">{category.rules}</p>
          </div>
        )}

        {(category.description || category.rules) && <Separator />}

        {/* Submission status card */}
        {category.hasSubmitted && category.submissionId && (
          <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={handleViewSubmission}
          >
            <CardContent className="py-4 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Your Submission</span>
                {category.submissionStatus === 'submitted' ? (
                  <Badge variant="default" className="bg-green-600 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Submitted
                  </Badge>
                ) : category.submissionStatus === 'uploaded' ? (
                  <Badge variant="default" className="bg-amber-500 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                ) : null}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* Action button */}
        <div>
          {isDisabled ? (
            <p className="text-sm text-muted-foreground">No submission was made for this category.</p>
          ) : contestFinished && category.hasSubmitted ? (
            <Button className="w-full" onClick={handleViewSubmission}>
              View Feedback
            </Button>
          ) : contestFinished ? (
            <p className="text-sm text-muted-foreground">No submission was made for this category.</p>
          ) : isClosed ? (
            <p className="text-sm text-muted-foreground">This category is no longer accepting submissions.</p>
          ) : category.hasSubmitted ? (
            <Button variant="outline" className="w-full" onClick={handleViewSubmission}>
              View Submission
            </Button>
          ) : (
            <Button className="w-full" onClick={handleSubmit}>
              Submit Entry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
