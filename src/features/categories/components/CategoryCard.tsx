// CategoryCard - Story 2.5, Story 3-1
// Display a category with status badge, type badge, judge info, and actions

import { useState, useEffect, useCallback } from 'react';
import { Video, Camera, UserMinus, Send, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from '@/components/ui';
import { useUpdateCategoryStatus } from '../hooks/useUpdateCategoryStatus';
import { useRemoveJudge } from '../hooks/useRemoveJudge';
import { useResendJudgeInvitation } from '../hooks/useResendJudgeInvitation';
import { categoriesApi } from '../api/categoriesApi';
import { EditCategoryForm } from './EditCategoryForm';
import { DeleteCategoryButton } from './DeleteCategoryButton';
import { AssignJudgeSheet } from './AssignJudgeSheet';
import { DuplicateCategoryDialog } from '@/features/divisions';
import { useConfirmClose } from '@/hooks/useConfirmClose';
import type { Category, CategoryStatus } from '../types/category.types';

interface CategoryCardProps {
  category: Category;
  contestId: string;
}

// Status badge colors
const statusColors: Record<CategoryStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  closed: 'bg-blue-100 text-blue-800',
};

// Type badge config
const typeConfig = {
  video: {
    icon: Video,
    className: 'bg-purple-100 text-purple-800',
  },
  photo: {
    icon: Camera,
    className: 'bg-orange-100 text-orange-800',
  },
};

// Format date using Intl.DateTimeFormat per architecture rules
function formatDeadline(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Card component displaying a single category
 * Includes status dropdown, edit/delete actions (draft only)
 */
export function CategoryCard({ category, contestId }: CategoryCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [optimisticStatus, setOptimisticStatus] = useState<CategoryStatus>(category.status);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [submissionCountError, setSubmissionCountError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const updateStatus = useUpdateCategoryStatus(contestId);
  const removeJudge = useRemoveJudge();
  const resendInvitation = useResendJudgeInvitation(contestId);

  const { guardClose, confirmDialog: editConfirmDialog } = useConfirmClose({
    isDirty: isFormDirty,
    onConfirmDiscard: () => {
      setFormKey((k) => k + 1);
      setIsFormDirty(false);
    },
  });

  // Sync optimistic status with prop changes (per story 2-4 pattern)
  useEffect(() => {
    setOptimisticStatus(category.status);
  }, [category.status]);

  // Fetch submission count - used on mount and before Draft status change
  const fetchSubmissionCount = async (): Promise<number> => {
    setIsLoadingCount(true);
    setSubmissionCountError(false);
    try {
      const count = await categoriesApi.getSubmissionCount(category.id);
      setSubmissionCount(count);
      setIsLoadingCount(false);
      return count;
    } catch {
      setSubmissionCountError(true);
      setIsLoadingCount(false);
      throw new Error('Failed to verify submission count');
    }
  };

  // Load submission count on mount for AC4 status change rules
  useEffect(() => {
    fetchSubmissionCount().catch(() => {
      // Error state already set in fetchSubmissionCount
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id]);

  // Story 7-2: Send/Resend judge invitation handler
  const canSendInvite =
    optimisticStatus === 'closed' &&
    !!category.assignedJudge;
  const isResend = !!category.invitedAt;

  const handleSendInvite = async () => {
    try {
      const result = await resendInvitation.mutateAsync(category.id);
      if (result.success) {
        toast.success(isResend ? 'Invitation resent successfully' : 'Invitation sent successfully');
        // F2: 30-second cooldown to prevent spam
        setResendCooldown(true);
        setTimeout(() => setResendCooldown(false), 30_000);
      } else {
        toast.error(result.error || 'Failed to resend invitation');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resend invitation'
      );
    }
  };

  const isDraft = optimisticStatus === 'draft';
  const isEditable = isDraft;
  const deadlinePassed = new Date(category.deadline) < new Date();

  const handleEditOpenChange = useCallback((open: boolean) => {
    if (!open && isEditable) {
      guardClose(() => {
        setIsFormDirty(false);
        setEditOpen(false);
      });
    } else if (!open) {
      setEditOpen(false);
    } else {
      setEditOpen(true);
    }
  }, [guardClose, isEditable]);

  // AC4: Draft disabled while loading, if has submissions, or on error
  const hasSubmissions = submissionCount !== null && submissionCount > 0;
  const draftDisabled = isLoadingCount || hasSubmissions || submissionCountError;
  const draftRestrictionReason = isLoadingCount
    ? 'Checking submissions...'
    : hasSubmissions
      ? `Cannot set to Draft - category has ${submissionCount} submission${submissionCount === 1 ? '' : 's'}`
      : submissionCountError
        ? 'Cannot verify submission count'
        : null;

  // Auto-close category if deadline passed (AC5 - client-side check)
  useEffect(() => {
    if (deadlinePassed && optimisticStatus !== 'closed') {
      handleStatusChange('closed');
    }
  // Only run on mount and when deadline/status change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlinePassed]);

  const handleStatusChange = async (newStatus: CategoryStatus) => {
    // AC4: For Draft status, always refetch submission count first
    if (newStatus === 'draft') {
      try {
        const freshCount = await fetchSubmissionCount();
        if (freshCount > 0) {
          toast.error(`Cannot set to Draft - category has ${freshCount} submission${freshCount === 1 ? '' : 's'}`);
          return;
        }
      } catch {
        toast.error('Cannot verify submission count - please try again');
        return;
      }
    }

    // Optimistic update
    const previousStatus = optimisticStatus;
    setOptimisticStatus(newStatus);

    try {
      await updateStatus.mutateAsync({
        categoryId: category.id,
        status: newStatus,
      });
      toast.success('Status updated');
    } catch (error) {
      // Rollback on error
      setOptimisticStatus(previousStatus);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      );
    }
  };

  const TypeIcon = typeConfig[category.type].icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <div className="flex gap-2">
            <Badge className={typeConfig[category.type].className}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {category.type}
            </Badge>
            <Badge className={statusColors[optimisticStatus]}>
              {optimisticStatus}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Deadline: {formatDeadline(category.deadline)}
          {deadlinePassed && (
            <span className="text-red-500 ml-2">(Passed)</span>
          )}
        </CardDescription>
      </CardHeader>

      {category.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </CardContent>
      )}

      {/* Story 3-1: Judge Assignment Section */}
      <CardContent className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Judge:</span>
          {category.assignedJudge ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {category.assignedJudge.email}
              </span>
              {/* F18: Invitation status indicator */}
              {optimisticStatus === 'closed' && !category.invitedAt && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                  Not invited
                </Badge>
              )}
              {/* Story 7-2: Send/Resend Invite with confirmation dialog */}
              {canSendInvite && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      disabled={resendInvitation.isPending || resendCooldown}
                      title={isResend ? 'Resend invitation email' : 'Send invitation email'}
                      aria-label={isResend ? 'Resend invitation email' : 'Send invitation email'}
                    >
                      {resendInvitation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{isResend ? 'Resend Invitation' : 'Send Invitation'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will send {isResend ? 'a new' : 'an'} invitation email to{' '}
                        <strong>{category.assignedJudge?.email}</strong> and
                        generate a login link.{isResend && ' Any previous invitation link will no longer work.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSendInvite}>
                        {isResend ? 'Resend' : 'Send'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {/* AC5: Remove Judge with confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive"
                    disabled={removeJudge.isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Judge</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove{' '}
                      <strong>{category.assignedJudge.email}</strong> from this
                      category? Any existing reviews will remain in the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await removeJudge.mutateAsync(category.id);
                          toast.success('Judge removed');
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : 'Failed to remove judge'
                          );
                        }
                      }}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <AssignJudgeSheet
              categoryId={category.id}
              categoryName={category.name}
            />
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full justify-between">
          <div className="flex flex-col gap-1">
            <Select
              value={optimisticStatus}
              onValueChange={(value) => handleStatusChange(value as CategoryStatus)}
              disabled={updateStatus.isPending || isLoadingCount}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft" disabled={draftDisabled}>
                  Draft
                </SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            {draftRestrictionReason && optimisticStatus !== 'draft' && (
              <p className="text-xs text-muted-foreground">{draftRestrictionReason}</p>
            )}
          </div>

          <div className="flex gap-2">
            {/* Story 2-9: Duplicate category to other divisions */}
            <DuplicateCategoryDialog
              categoryId={category.id}
              categoryName={category.name}
              contestId={contestId}
              currentDivisionId={category.divisionId}
            />
            {/* AC3: View button for published/closed (read-only form), Edit+Delete for draft */}
            <Sheet open={editOpen} onOpenChange={handleEditOpenChange}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  {isEditable ? 'Edit' : 'View'}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    {isEditable ? 'Edit Category' : 'View Category'}
                  </SheetTitle>
                </SheetHeader>
                <EditCategoryForm
                  key={formKey}
                  category={category}
                  contestId={contestId}
                  onSuccess={() => {
                    setIsFormDirty(false);
                    setEditOpen(false);
                  }}
                  onDirtyChange={isEditable ? setIsFormDirty : undefined}
                  readOnly={!isEditable}
                />
              </SheetContent>
              {editConfirmDialog}
            </Sheet>
            {isEditable && (
              <DeleteCategoryButton
                categoryId={category.id}
                contestId={contestId}
                categoryName={category.name}
              />
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
