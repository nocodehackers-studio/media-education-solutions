// Story 6-1/6-3: Admin submission detail panel (Sheet slide-over)
// Shows full participant PII + media preview + override controls

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Video, Trophy } from 'lucide-react'
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui'
import { PhotoLightbox } from './PhotoLightbox'
import { AdminReviewSection } from './AdminReviewSection'
import { OverrideFeedbackDialog } from './OverrideFeedbackDialog'
import { DisqualifyConfirmDialog } from './DisqualifyConfirmDialog'
import { RestoreConfirmDialog } from './RestoreConfirmDialog'
import type { AdminSubmission } from '../types/adminSubmission.types'
import { SUBMISSION_STATUS_VARIANT, formatSubmissionDate } from '../types/adminSubmission.types'

interface AdminSubmissionDetailProps {
  submission: AdminSubmission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminSubmissionDetail({
  submission,
  open,
  onOpenChange,
}: AdminSubmissionDetailProps) {
  const navigate = useNavigate()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [disqualifyOpen, setDisqualifyOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)

  if (!submission) return null

  const videoEmbedUrl = submission.mediaUrl
    ? submission.mediaUrl.includes('?')
      ? `${submission.mediaUrl}&autoplay=false&preload=true&responsive=true`
      : `${submission.mediaUrl}?autoplay=false&preload=true&responsive=true`
    : null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Submission Details</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Participant Info */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Participant</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Code</dt>
                <dd className="font-mono">{submission.participantCode}</dd>

                <dt className="text-muted-foreground">Name</dt>
                <dd>{submission.participantName ?? '—'}</dd>

                <dt className="text-muted-foreground">Institution</dt>
                <dd>{submission.organizationName ?? '—'}</dd>

                <dt className="text-muted-foreground">TLC Name</dt>
                <dd>{submission.tlcName ?? '—'}</dd>

                <dt className="text-muted-foreground">TLC Email</dt>
                <dd>{submission.tlcEmail ?? '—'}</dd>
              </dl>
            </section>

            {/* Submission Metadata */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Submission</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Category</dt>
                <dd>{submission.categoryName}</dd>

                <dt className="text-muted-foreground">Media Type</dt>
                <dd className="capitalize">{submission.mediaType}</dd>

                <dt className="text-muted-foreground">Submitted</dt>
                <dd>{formatSubmissionDate(submission.submittedAt, 'long')}</dd>

                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={SUBMISSION_STATUS_VARIANT[submission.status] ?? 'secondary'}>
                    {submission.status}
                  </Badge>
                </dd>
              </dl>

              {/* Disqualify / Restore actions */}
              {submission.status === 'submitted' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDisqualifyOpen(true)}
                >
                  Disqualify
                </Button>
              )}
              {submission.status === 'disqualified' && (
                <div className="space-y-2">
                  {submission.disqualifiedAt && (
                    <p className="text-sm text-muted-foreground">
                      Disqualified {formatSubmissionDate(submission.disqualifiedAt)}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRestoreOpen(true)}
                  >
                    Restore
                  </Button>
                </div>
              )}
            </section>

            {/* Judge Review */}
            <AdminReviewSection
              review={submission.review}
              assignedJudgeName={submission.assignedJudgeName}
              rankingPosition={submission.rankingPosition}
              onOverrideFeedback={
                submission.review ? () => setOverrideDialogOpen(true) : undefined
              }
            />

            {/* View Rankings link */}
            {submission.categoryId && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 w-full"
                onClick={() => {
                  onOpenChange(false)
                  // categories.divisions.contest_id is needed; extract from route or submission context
                  // The contestId is in the URL when viewing submissions
                  const match = window.location.pathname.match(/\/admin\/contests\/([^/]+)/)
                  const contestId = match?.[1]
                  if (contestId) {
                    navigate(`/admin/contests/${contestId}/categories/${submission.categoryId}/rankings`)
                  }
                }}
              >
                <Trophy className="h-4 w-4" />
                View Category Rankings
              </Button>
            )}

            {/* Media Preview */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Media</h3>
              {!submission.mediaUrl ? (
                <div className="flex h-48 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  {submission.mediaType === 'video' ? (
                    <Video className="h-10 w-10" />
                  ) : (
                    <Camera className="h-10 w-10" />
                  )}
                </div>
              ) : submission.mediaType === 'video' && videoEmbedUrl ? (
                <div className="rounded-lg overflow-hidden border">
                  <iframe
                    src={videoEmbedUrl}
                    className="w-full aspect-video"
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={`Video by ${submission.participantCode}`}
                  />
                </div>
              ) : (
                <div
                  className="rounded-lg overflow-hidden border bg-muted cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={submission.mediaUrl}
                    alt={`Photo by ${submission.participantCode}`}
                    className="max-h-[400px] w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {lightboxOpen && submission.mediaUrl && submission.mediaType === 'photo' && (
        <PhotoLightbox
          src={submission.mediaUrl}
          alt={`Photo by ${submission.participantCode}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {submission.review && (
        <OverrideFeedbackDialog
          reviewId={submission.review.reviewId}
          originalFeedback={submission.review.feedback}
          currentOverride={submission.review.adminFeedbackOverride}
          open={overrideDialogOpen}
          onOpenChange={setOverrideDialogOpen}
        />
      )}

      {submission.status === 'submitted' && (
        <DisqualifyConfirmDialog
          submissionId={submission.id}
          participantCode={submission.participantCode}
          categoryName={submission.categoryName}
          open={disqualifyOpen}
          onOpenChange={setDisqualifyOpen}
        />
      )}

      {submission.status === 'disqualified' && (
        <RestoreConfirmDialog
          submissionId={submission.id}
          participantCode={submission.participantCode}
          categoryName={submission.categoryName}
          open={restoreOpen}
          onOpenChange={setRestoreOpen}
        />
      )}
    </>
  )
}
