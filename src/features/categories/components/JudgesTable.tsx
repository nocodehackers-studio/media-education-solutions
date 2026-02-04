// Story 3-5: JudgesTable component (AC1, AC4)
// Table displaying categories with judge assignments and progress

import { useState } from 'react';
import { Send } from 'lucide-react';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@/components/ui';
import { AssignJudgeSheet } from './AssignJudgeSheet';
import { JudgeProgressCell } from './JudgeProgressCell';
import { JudgeDetailSheet } from './JudgeDetailSheet';
import { useResendJudgeInvitation } from '../hooks/useResendJudgeInvitation';
import type { Category } from '../types';

interface JudgesTableProps {
  categories: Category[];
  contestId: string;
}

// TODO: Epic 5 optimization - When reviews table exists, batch-fetch progress
// for all categories in parent component to avoid N+1 queries from JudgeProgressCell.

export function JudgesTable({ categories, contestId }: JudgesTableProps) {
  const resendInvitation = useResendJudgeInvitation(contestId);
  const [viewingJudge, setViewingJudge] = useState<{
    judgeName: string;
    categoryId: string;
    categoryName: string;
  } | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Judge</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              {/* Category Name */}
              <TableCell className="font-medium">{category.name}</TableCell>

              {/* Judge Email (AC1, AC4, AC5) */}
              <TableCell>
                {category.assignedJudge ? (
                  <button
                    type="button"
                    className="text-primary hover:underline cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    onClick={() => {
                      const judge = category.assignedJudge;
                      if (judge) {
                        setViewingJudge({
                          judgeName: judge.email,
                          categoryId: category.id,
                          categoryName: category.name,
                        });
                      }
                    }}
                  >
                    {category.assignedJudge.email}
                  </button>
                ) : (
                  <span className="text-muted-foreground">No judge assigned</span>
                )}
              </TableCell>

              {/* Progress (AC2) */}
              <TableCell>
                {category.assignedJudge ? (
                  <JudgeProgressCell categoryId={category.id} />
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>

              {/* Status (AC3) */}
              <TableCell>
                <JudgeStatusBadge hasJudge={!!category.assignedJudge} />
              </TableCell>

              {/* Actions (AC4) - Assign, resend invite, or reassign */}
              <TableCell>
                {category.assignedJudge ? (
                  <div className="flex items-center gap-1">
                    {category.invitedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Resend invitation"
                        disabled={resendInvitation.isPending}
                        onClick={() => {
                          resendInvitation.mutate(category.id, {
                            onSuccess: () => toast.success('Invitation resent'),
                            onError: (err) => toast.error(err.message),
                          });
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <AssignJudgeSheet
                      categoryId={category.id}
                      categoryName={category.name}
                      mode="reassign"
                    />
                  </div>
                ) : (
                  <AssignJudgeSheet
                    categoryId={category.id}
                    categoryName={category.name}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Judge Detail Sheet (AC5) */}
      {viewingJudge && (
        <JudgeDetailSheet
          open={!!viewingJudge}
          onOpenChange={(open) => !open && setViewingJudge(null)}
          judgeName={viewingJudge.judgeName}
          categoryId={viewingJudge.categoryId}
          categoryName={viewingJudge.categoryName}
        />
      )}
    </>
  );
}

// Status badge component
function JudgeStatusBadge({ hasJudge }: { hasJudge: boolean }) {
  // TODO: Once reviews table exists, check if all reviews complete
  // For now, show "Awaiting" for assigned judges, "Unassigned" otherwise

  if (!hasJudge) {
    return <Badge variant="outline">Unassigned</Badge>;
  }

  // Placeholder until Epic 5 - reviews table doesn't exist yet
  return <Badge variant="secondary">Awaiting</Badge>;
}
