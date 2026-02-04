import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { categoriesApi, useCategoriesByContest } from '@/features/categories';
import { useUpdateContestStatus } from './useUpdateContestStatus';
import type { ContestStatus } from '../types/contest.types';
import type { CascadeStatusDialogProps } from '../components/CascadeStatusDialog';

/**
 * Hook that manages the complete cascade flow when changing contest status.
 * Determines if a cascade modal should be shown, handles confirm/cancel actions,
 * and updates both contest and category statuses accordingly.
 */
export function useCascadeContestStatus(contestId: string, currentContestStatus: ContestStatus) {
  const queryClient = useQueryClient();
  const updateContestStatus = useUpdateContestStatus();
  const { data: categories, isLoading: categoriesLoading } = useCategoriesByContest(contestId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingContestStatus, setPendingContestStatus] = useState<ContestStatus | null>(null);
  const [cascadeFromStatus, setCascadeFromStatus] = useState<'draft' | 'published'>('draft');
  const [cascadeToStatus, setCascadeToStatus] = useState<'published' | 'closed'>('published');
  const [affectedCount, setAffectedCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['contests'] });
    queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    queryClient.invalidateQueries({ queryKey: ['categories', contestId] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['divisions'] });
  };

  const handleStatusChange = (newStatus: ContestStatus) => {
    setPendingContestStatus(newStatus);

    // F3: If categories haven't loaded yet, skip cascade check and update directly
    if (categoriesLoading || !categories) {
      updateContestDirectly(newStatus);
      return;
    }

    // draft → published: check for draft categories
    if (currentContestStatus === 'draft' && newStatus === 'published') {
      const draftCount = categories.filter((c) => c.status === 'draft').length;
      if (draftCount > 0) {
        setCascadeFromStatus('draft');
        setCascadeToStatus('published');
        setAffectedCount(draftCount);
        setDialogOpen(true);
        return;
      }
    }

    // published → closed/reviewed/finished: check for published categories
    if (
      currentContestStatus === 'published' &&
      (newStatus === 'closed' || newStatus === 'reviewed' || newStatus === 'finished')
    ) {
      const publishedCount = categories.filter((c) => c.status === 'published').length;
      if (publishedCount > 0) {
        setCascadeFromStatus('published');
        setCascadeToStatus('closed');
        setAffectedCount(publishedCount);
        setDialogOpen(true);
        return;
      }
    }

    // No cascade needed — update contest directly
    updateContestDirectly(newStatus);
  };

  const updateContestDirectly = async (newStatus: ContestStatus) => {
    setIsUpdating(true);
    try {
      await updateContestStatus.mutateAsync({ id: contestId, status: newStatus });
      toast.success('Status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
      setPendingContestStatus(null);
    }
  };

  // F2: Use mutation consistently for contest status updates
  const handleConfirm = async () => {
    if (!pendingContestStatus) return;
    setIsUpdating(true);

    try {
      // Update contest first via mutation
      await updateContestStatus.mutateAsync({ id: contestId, status: pendingContestStatus });

      // Cascade category updates
      try {
        const { updatedIds } = await categoriesApi.bulkUpdateStatusByContest(
          contestId,
          cascadeFromStatus,
          cascadeToStatus
        );

        // F10: Send judge invitations concurrently, report failures
        if (cascadeToStatus === 'closed' && updatedIds.length > 0) {
          const results = await Promise.allSettled(
            updatedIds.map((id) => categoriesApi.sendJudgeInvitation(id))
          );
          const failCount = results.filter((r) => r.status === 'rejected').length;
          if (failCount > 0) {
            toast.warning(`${failCount} judge invitation${failCount === 1 ? '' : 's'} failed to send.`);
          }
        }

        toast.success(
          `Contest updated. ${updatedIds.length} ${updatedIds.length === 1 ? 'category' : 'categories'} also updated.`
        );
      } catch {
        toast.error('Contest updated but failed to update categories. Please update them manually.');
      }

      invalidateAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
      setDialogOpen(false);
      setPendingContestStatus(null);
    }
  };

  const handleCancel = async () => {
    if (!pendingContestStatus) return;
    setIsUpdating(true);

    try {
      await updateContestStatus.mutateAsync({ id: contestId, status: pendingContestStatus });
      toast.success('Status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
      setDialogOpen(false);
      setPendingContestStatus(null);
    }
  };

  // F11: Dismiss via overlay/Escape should also update contest (same as Cancel)
  const handleDismiss = (open: boolean) => {
    if (!open && !isUpdating) {
      if (pendingContestStatus) {
        handleCancel();
      } else {
        setDialogOpen(false);
      }
    }
  };

  const cascadeDialogProps: CascadeStatusDialogProps = {
    open: dialogOpen,
    onOpenChange: handleDismiss,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    isPending: isUpdating,
    categoryCount: affectedCount,
    fromCategoryStatus: cascadeFromStatus,
    toCategoryStatus: cascadeToStatus,
  };

  return {
    handleStatusChange,
    cascadeDialogProps,
    isUpdating: isUpdating || updateContestStatus.isPending,
    pendingStatus: pendingContestStatus,
  };
}
