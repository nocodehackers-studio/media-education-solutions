import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  ArrowLeft,
  Video,
  Image,
  CheckCircle,
  Lock,
  Pencil,
  User,
  Mail,
  Users,
} from 'lucide-react'
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from '@/components/ui'
import {
  DeadlineCountdown,
  ParticipantFeedbackSection,
  useParticipantCategories,
  type ParticipantCategory,
} from '@/features/participants'
import {
  SubmissionPreview,
  EditSubmissionInfoSheet,
  useSubmissionPreview,
} from '@/features/submissions'
import { useParticipantSession } from '@/contexts'

interface LocationState {
  category?: ParticipantCategory
  contestFinished?: boolean
  acceptingSubmissions?: boolean
}

/**
 * Category detail page — shows full category info (description, rules, deadline)
 * and inline submission preview when one exists.
 */
export function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useParticipantSession()
  const [editSheetOpen, setEditSheetOpen] = useState(false)

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

  const acceptingSubmissions =
    state?.acceptingSubmissions ?? cachedData?.acceptingSubmissions ?? false

  // Fetch full submission data when a submission exists
  const {
    data: submissionData,
    isLoading: submissionLoading,
  } = useSubmissionPreview({
    submissionId: category?.submissionId ?? undefined,
    participantId: session?.participantId ?? '',
    participantCode: session?.code ?? '',
  })

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
  const hasSubmission = category.hasSubmitted && category.submissionId

  const handleSubmit = () => {
    navigate(`/participant/submit/${category.id}`, {
      state: { type: category.type, acceptingSubmissions },
    })
  }

  const handleReplace = () => {
    navigate(`/participant/submit/${category.id}`, {
      state: { type: category.type, acceptingSubmissions },
    })
  }

  const submission = submissionData?.submission
  const isLocked = submission?.isLocked ?? false

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
            <DeadlineCountdown
              deadline={category.deadline}
              timezone={session?.contestTimezone || 'America/New_York'}
              className="text-base"
            />
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
            <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(category.description) }} />
          </div>
        )}

        {/* Rules section */}
        {category.rules && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Rules
            </h2>
            <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(category.rules) }} />
          </div>
        )}

        {(category.description || category.rules) && <Separator />}

        {/* Inline submission preview */}
        {hasSubmission && submissionLoading && (
          <div className="space-y-4">
            <Skeleton className="w-full aspect-video rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        )}

        {hasSubmission && submission && (
          <>
            {/* Media preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Your Submission</CardTitle>
                  <Badge variant="default" className="bg-green-600 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Submitted
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <SubmissionPreview
                  submission={submission}
                  libraryId={submissionData.libraryId}
                  videoReady={submissionData.videoReady}
                />
              </CardContent>
            </Card>

            {/* Submission details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{submission.studentName || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teacher/Leader/Coach</p>
                    <p className="text-sm font-medium">{submission.tlcName || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">TLC Email</p>
                    <p className="text-sm font-medium">{submission.tlcEmail || 'Not provided'}</p>
                  </div>
                </div>
                {submission.groupMemberNames && (
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Group Members</p>
                      <p className="text-sm font-medium">{submission.groupMemberNames}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback section when contest is finished */}
            {contestFinished && (
              <>
                {submission.review ? (
                  <ParticipantFeedbackSection feedback={submission.review} />
                ) : (
                  <Card>
                    <CardContent className="py-6">
                      <p className="text-sm text-muted-foreground text-center">
                        Your submission has not been reviewed yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Lock state message */}
            {!contestFinished && isLocked && (
              <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg">
                <Lock className="h-5 w-5 flex-shrink-0" />
                <p>
                  {submission.categoryStatus === 'closed'
                    ? 'This category is no longer accepting changes'
                    : 'Deadline passed — submission locked'}
                </p>
              </div>
            )}

            {/* Action buttons */}
            {!contestFinished && !isLocked && (
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleReplace}>
                  Replace
                </Button>
                <Button variant="outline" onClick={() => setEditSheetOpen(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit Submission
                </Button>
              </div>
            )}
          </>
        )}

        {/* No submission — show action */}
        {!hasSubmission && (
          <div>
            {isDisabled ? (
              <p className="text-sm text-muted-foreground">No submission was made for this category.</p>
            ) : contestFinished ? (
              <p className="text-sm text-muted-foreground">No submission was made for this category.</p>
            ) : !acceptingSubmissions ? (
              <p className="text-sm text-muted-foreground">This contest is closed. Submissions are no longer accepted.</p>
            ) : isClosed ? (
              <p className="text-sm text-muted-foreground">This category is no longer accepting submissions.</p>
            ) : (
              <Button className="w-full" onClick={handleSubmit}>
                Submit Entry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Submission Info Sheet (includes withdraw in danger zone) */}
      {submission && category.submissionId && session && (
        <EditSubmissionInfoSheet
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          submission={submission}
          participantId={session.participantId}
          participantCode={session.code}
          submissionId={category.submissionId}
          isLocked={isLocked}
        />
      )}
    </div>
  )
}
