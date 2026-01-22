// DivisionList - Story 2.9
// List of divisions with actions for a contest

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui';
import { useDivisions } from '../hooks/useDivisions';
import { DivisionListItem } from './DivisionListItem';
import { CreateDivisionSheet } from './CreateDivisionSheet';

interface DivisionListProps {
  contestId: string;
}

/**
 * List component for managing divisions within a contest
 * Shows division list with add/edit/delete actions
 */
export function DivisionList({ contestId }: DivisionListProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: divisions, isLoading, error } = useDivisions(contestId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Divisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Divisions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Failed to load divisions. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isOnlyDivision = (divisions?.length ?? 0) <= 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Divisions</CardTitle>
          <CardDescription>
            Organize categories by competition level (e.g., High School, Teen, Teachers)
          </CardDescription>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Division
        </Button>
      </CardHeader>
      <CardContent>
        {divisions?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No divisions yet. Add one to get started.
            </p>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Division
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {divisions?.map((division) => (
              <DivisionListItem
                key={division.id}
                division={division}
                contestId={contestId}
                isOnlyDivision={isOnlyDivision}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CreateDivisionSheet
        contestId={contestId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </Card>
  );
}
