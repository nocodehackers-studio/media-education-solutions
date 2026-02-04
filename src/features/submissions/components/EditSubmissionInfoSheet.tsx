import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import {
  Button,
  Form,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Separator,
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
import { SubmissionInfoFields } from './SubmissionInfoFields'
import {
  submissionInfoSchema,
  type SubmissionInfoFormData,
} from '../types/submissionInfo.schema'
import { useUpdateSubmissionInfo } from '../hooks/useUpdateSubmissionInfo'
import { useWithdrawSubmission } from '../hooks/useWithdrawSubmission'
import type { SubmissionPreviewData } from '../hooks/useSubmissionPreview'

interface EditSubmissionInfoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: SubmissionPreviewData
  participantId: string
  participantCode: string
  submissionId: string
  isLocked: boolean
}

export function EditSubmissionInfoSheet({
  open,
  onOpenChange,
  submission,
  participantId,
  participantCode,
  submissionId,
  isLocked,
}: EditSubmissionInfoSheetProps) {
  const updateMutation = useUpdateSubmissionInfo()
  const withdrawMutation = useWithdrawSubmission()

  const form = useForm<SubmissionInfoFormData>({
    resolver: zodResolver(submissionInfoSchema),
    values: {
      studentName: submission.studentName ?? '',
      tlcName: submission.tlcName ?? '',
      tlcEmail: submission.tlcEmail ?? '',
      groupMemberNames: submission.groupMemberNames ?? '',
    },
  })

  const handleSave = (data: SubmissionInfoFormData) => {
    updateMutation.mutate(
      {
        submissionId,
        participantId,
        participantCode,
        studentName: data.studentName,
        tlcName: data.tlcName,
        tlcEmail: data.tlcEmail,
        groupMemberNames: data.groupMemberNames || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  const handleWithdraw = () => {
    if (withdrawMutation.isPending) return
    withdrawMutation.mutate({
      submissionId,
      participantId,
      participantCode,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Submission Details</SheetTitle>
          <SheetDescription>
            Update your submission information for {submission.categoryName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Edit Info Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <SubmissionInfoFields
                control={form.control}
                disabled={isLocked || updateMutation.isPending}
              />
              {!isLocked && (
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !form.formState.isDirty}
                  className="w-full"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </form>
          </Form>

          {/* Danger Zone */}
          {!isLocked && (
            <>
              <Separator />
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-sm">Danger Zone</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Withdrawing will permanently remove your submission. You can submit again before the deadline.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      Withdraw Submission
                    </Button>
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
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
