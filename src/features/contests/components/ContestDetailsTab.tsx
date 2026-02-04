import { useState } from 'react';
import { Button } from '@/components/ui';
import { EditContestForm } from './EditContestForm';
import { DeleteContestButton } from './DeleteContestButton';
import type { Contest } from '../types/contest.types';

interface ContestDetailsTabProps {
  contest: Contest;
}

/**
 * Details tab content for contest detail page
 * Shows contest info with edit toggle
 */
export function ContestDetailsTab({ contest }: ContestDetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant={isEditing ? 'outline' : 'default'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>
      {isEditing ? (
        <EditContestForm
          contest={contest}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Description
            </h3>
            <p className="mt-1 text-sm">
              {contest.description || 'No description provided'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Rules
            </h3>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {contest.rules || 'No rules provided'}
            </p>
          </div>
        </div>
      )}
      <div className="pt-4 border-t">
        <DeleteContestButton contestId={contest.id} />
      </div>
    </div>
  );
}
