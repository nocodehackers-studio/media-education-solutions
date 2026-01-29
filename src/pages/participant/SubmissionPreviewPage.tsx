// Story 4-6: Submission preview and confirm page
// Shows uploaded media, allows confirm or replace
// F6: ParticipantRoute handles session guard — no redundant navigate here

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  SubmissionPreview,
  SubmissionPreviewSkeleton,
  useSubmissionPreview,
  useConfirmSubmission,
} from '@/features/submissions'
import { useParticipantSession } from '@/contexts'

export function SubmissionPreviewPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const navigate = useNavigate()
  const { session } = useParticipantSession()

  const { data, isLoading, error } = useSubmissionPreview({
    submissionId,
    participantId: session?.participantId ?? '',
    participantCode: session?.code ?? '',
  })

  const confirmMutation = useConfirmSubmission()

  const handleConfirm = () => {
    if (!submissionId || !session) return
    confirmMutation.mutate({
      submissionId,
      participantId: session.participantId,
      participantCode: session.code,
    })
  }

  const handleReplace = () => {
    if (data?.submission.categoryId) {
      navigate(`/participant/submit/${data.submission.categoryId}`)
    }
  }

  const handleBack = () => {
    navigate('/participant/categories')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <SubmissionPreviewSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Preview</h1>
          </div>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-destructive">
                Submission not found. It may have been removed.
              </p>
              <Button variant="outline" className="mt-4" onClick={handleBack}>
                Back to Categories
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { submission, libraryId } = data
  const isConfirmed = submission.status === 'submitted'
  const canConfirm = submission.status === 'uploaded'

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Preview Submission</h1>
            <p className="text-muted-foreground">{submission.categoryName}</p>
          </div>
        </div>

        {/* Media Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {submission.mediaType === 'video' ? 'Video' : 'Photo'} Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionPreview submission={submission} libraryId={libraryId} />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isConfirmed ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-5 w-5" />
              Submitted!
            </div>
          ) : canConfirm ? (
            <Button
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm Submission'}
            </Button>
          ) : null}

          {/* F10: Only show Replace when submission can still be replaced (not already confirmed) */}
          {canConfirm && (
            <Button variant="outline" onClick={handleReplace}>
              Replace
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
