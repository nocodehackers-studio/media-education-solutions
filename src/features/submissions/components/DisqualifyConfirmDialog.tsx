// Story 6-4: Confirmation dialog for disqualifying a submission

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui'
import { useDisqualifySubmission } from '../hooks/useDisqualifySubmission'

interface DisqualifyConfirmDialogProps {
  submissionId: string
  participantCode: string
  categoryName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DisqualifyConfirmDialog({
  submissionId,
  participantCode,
  categoryName,
  open,
  onOpenChange,
}: DisqualifyConfirmDialogProps) {
  const disqualifyMutation = useDisqualifySubmission()

  const handleDisqualify = async () => {
    try {
      await disqualifyMutation.mutateAsync(submissionId)
      onOpenChange(false)
    } catch {
      // Error toast handled by mutation onError
    }
  }

  const handleOpenChange = (value: boolean) => {
    if (disqualifyMutation.isPending) return
    onOpenChange(value)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disqualify Submission</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to disqualify this submission?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm text-muted-foreground">
          <p>
            Participant: <span className="font-mono">{participantCode}</span>
          </p>
          <p>Category: {categoryName}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={disqualifyMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDisqualify()
            }}
            disabled={disqualifyMutation.isPending}
            className="bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90"
          >
            {disqualifyMutation.isPending ? 'Disqualifying...' : 'Disqualify'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
