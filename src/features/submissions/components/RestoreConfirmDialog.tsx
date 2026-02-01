// Story 6-4: Confirmation dialog for restoring a disqualified submission

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
import { useRestoreSubmission } from '../hooks/useRestoreSubmission'

interface RestoreConfirmDialogProps {
  submissionId: string
  participantCode: string
  categoryName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RestoreConfirmDialog({
  submissionId,
  participantCode,
  categoryName,
  open,
  onOpenChange,
}: RestoreConfirmDialogProps) {
  const restoreMutation = useRestoreSubmission()

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(submissionId)
      onOpenChange(false)
    } catch {
      // Error toast handled by mutation onError
    }
  }

  const handleOpenChange = (value: boolean) => {
    if (restoreMutation.isPending) return
    onOpenChange(value)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore Submission</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to restore this submission?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Participant: <span className="font-mono">{participantCode}</span>
          </p>
          <p>Category: {categoryName}</p>
          <p className="text-amber-600 dark:text-amber-400">
            This will NOT automatically re-add the submission to rankings.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={restoreMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleRestore()
            }}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
