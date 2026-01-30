// Story 4-6/4-7: Submission preview page
// Shows uploaded media, allows confirm, replace, or withdraw
// Story 4-7: Added Replace/Withdraw for submitted status, deadline lock state

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui'
import {
  SubmissionPreview,
  SubmissionPreviewSkeleton,
  useSubmissionPreview,
  useConfirmSubmission,
  useWithdrawSubmission,
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
  const withdrawMutation = useWithdrawSubmission()

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

  const handleWithdraw = () => {
    if (!submissionId || !session) return
    withdrawMutation.mutate({
      submissionId,
      participantId: session.participantId,
      participantCode: session.code,
    })
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
  const isLocked = submission.isLocked

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

        {/* Lock State Message */}
        {isLocked && (
          <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg">
            <Lock className="h-5 w-5 flex-shrink-0" />
            <p>
              {submission.categoryStatus === 'closed'
                ? 'This category is no longer accepting changes'
                : 'Deadline passed \u2014 submission locked'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!isLocked && (
          <div className="flex flex-wrap gap-3">
            {/* Confirm button (only for uploaded/unconfirmed) */}
            {canConfirm && (
              <Button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? 'Confirming...' : 'Confirm Submission'}
              </Button>
            )}

            {/* Submitted badge */}
            {isConfirmed && (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="h-5 w-5" />
                Submitted
              </div>
            )}

            {/* Replace button (uploaded or submitted, not locked) */}
            {(canConfirm || isConfirmed) && (
              <Button variant="outline" onClick={handleReplace}>
                Replace
              </Button>
            )}

            {/* Withdraw button with confirmation dialog */}
            {(canConfirm || isConfirmed) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Withdraw</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Withdraw submission?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove your submission. You can submit again before the deadline.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleWithdraw}
                      disabled={withdrawMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
