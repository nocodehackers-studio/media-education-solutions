import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@/components/ui';
import { EditContestForm } from './EditContestForm';
import { useUpdateContestStatus } from '../hooks/useUpdateContestStatus';
import type { Contest, ContestStatus } from '../types/contest.types';

interface ContestDetailsTabProps {
  contest: Contest;
}

const statusOptions: { value: ContestStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'finished', label: 'Finished' },
];

/**
 * Details tab content for contest detail page
 * Shows contest info with edit toggle and status dropdown
 */
export function ContestDetailsTab({ contest }: ContestDetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<ContestStatus>(contest.status);
  const updateStatus = useUpdateContestStatus();

  const handleStatusChange = async (newStatus: ContestStatus) => {
    const previousStatus = optimisticStatus;
    setOptimisticStatus(newStatus); // Optimistic update

    try {
      await updateStatus.mutateAsync({ id: contest.id, status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      setOptimisticStatus(previousStatus); // Revert on error
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      );
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Contest Details</CardTitle>
        <div className="flex gap-2">
          <Select
            value={optimisticStatus}
            onValueChange={(value) => handleStatusChange(value as ContestStatus)}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger className="w-[140px]" data-testid="status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={isEditing ? 'outline' : 'default'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <EditContestForm
            contest={contest}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Description
              </h3>
              <p className="mt-1">
                {contest.description || 'No description provided'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Rules
              </h3>
              <p className="mt-1 whitespace-pre-wrap">
                {contest.rules || 'No rules provided'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Contest Code
              </h3>
              <p className="mt-1 font-mono text-lg">{contest.contestCode}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
