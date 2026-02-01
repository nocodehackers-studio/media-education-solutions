// Story 6-3: Admin override feedback dialog (AC: #1, #2)
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Textarea,
  Badge,
} from '@/components/ui'
import { useOverrideFeedback } from '../hooks/useOverrideFeedback'

interface OverrideFeedbackDialogProps {
  reviewId: string
  originalFeedback: string | null
  currentOverride: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OverrideFeedbackDialog({
  reviewId,
  originalFeedback,
  currentOverride,
  open,
  onOpenChange,
}: OverrideFeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Override Feedback</DialogTitle>
        </DialogHeader>
        {open && (
          <OverrideFeedbackForm
            reviewId={reviewId}
            originalFeedback={originalFeedback}
            currentOverride={currentOverride}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface OverrideFeedbackFormProps {
  reviewId: string
  originalFeedback: string | null
  currentOverride: string | null
  onClose: () => void
}

function OverrideFeedbackForm({
  reviewId,
  originalFeedback,
  currentOverride,
  onClose,
}: OverrideFeedbackFormProps) {
  const [feedbackText, setFeedbackText] = useState(currentOverride ?? '')
  const { overrideMutation, clearMutation } = useOverrideFeedback()

  const handleSave = async () => {
    if (!feedbackText.trim()) {
      toast.error('Override feedback cannot be empty')
      return
    }

    try {
      await overrideMutation.mutateAsync({ reviewId, feedback: feedbackText.trim() })
      toast.success('Feedback override saved')
      onClose()
    } catch {
      toast.error('Failed to save feedback override')
    }
  }

  const handleClear = async () => {
    try {
      await clearMutation.mutateAsync(reviewId)
      toast.success('Feedback override cleared')
      onClose()
    } catch {
      toast.error('Failed to clear feedback override')
    }
  }

  const isSaving = overrideMutation.isPending || clearMutation.isPending

  return (
    <div className="space-y-4">
      {/* Original feedback (read-only) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Original Judge Feedback
        </label>
        <div className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {originalFeedback || 'No feedback provided'}
        </div>
      </div>

      {/* Override textarea */}
      <div className="space-y-1.5">
        <label htmlFor="override-feedback" className="text-sm font-medium">
          Admin Override
          {currentOverride && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Overridden
            </Badge>
          )}
        </label>
        <Textarea
          id="override-feedback"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Enter override feedback..."
          rows={5}
          disabled={isSaving}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <div>
          {currentOverride && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSaving}
            >
              {clearMutation.isPending ? 'Clearing...' : 'Clear Override'}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !feedbackText.trim()}
          >
            {overrideMutation.isPending ? 'Saving...' : 'Save Override'}
          </Button>
        </div>
      </div>
    </div>
  )
}
