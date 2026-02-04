import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Contest Details</CardTitle>
        <Button
          variant={isEditing ? 'outline' : 'default'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
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
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                T/L/C Notifications
              </h3>
              <p className="mt-1">
                {contest.notifyTlc ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        )}
        <div className="mt-8 pt-6 border-t">
          <DeleteContestButton contestId={contest.id} />
        </div>
      </CardContent>
    </Card>
  );
}
