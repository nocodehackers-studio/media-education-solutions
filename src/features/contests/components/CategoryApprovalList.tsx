// Story 6-5: Category approval list for winners page
// F7 fix: accepts categories + isLoading as props from parent (single data source)
// F5 fix: includes Reviews column

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ExternalLink } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@/components/ui';
import { useApproveCategory, useUnapproveCategory } from '@/features/contests';
import type { CategoryApprovalStatus } from '@/features/contests';

interface CategoryApprovalListProps {
  contestId: string;
  categories?: CategoryApprovalStatus[];
  isLoading: boolean;
}

export function CategoryApprovalList({ contestId, categories, isLoading }: CategoryApprovalListProps) {
  const approveMutation = useApproveCategory();
  const unapproveMutation = useUnapproveCategory();

  const { approvedCount, totalCount, progressPercent } = useMemo(() => {
    if (!categories) return { approvedCount: 0, totalCount: 0, progressPercent: 0 };
    const total = categories.length;
    const approved = categories.filter((c) => c.approvedForWinners).length;
    return {
      approvedCount: approved,
      totalCount: total,
      progressPercent: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  }, [categories]);

  const handleApprove = (categoryId: string) => {
    approveMutation.mutate(categoryId, {
      onSuccess: () => toast.success('Category approved for winners'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleUnapprove = (categoryId: string) => {
    unapproveMutation.mutate(categoryId, {
      onSuccess: () => toast.success('Category approval revoked'),
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No categories found for this contest.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Category Approval</CardTitle>
          <Badge variant={approvedCount === totalCount ? 'default' : 'secondary'}>
            {approvedCount} of {totalCount} approved
          </Badge>
        </div>
        <Progress value={progressPercent} className="mt-2" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Submissions</TableHead>
              <TableHead className="text-center">Reviews</TableHead>
              <TableHead className="text-center">Rankings</TableHead>
              <TableHead>Judging</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => {
              const canApprove = cat.judgingCompleted && cat.rankingCount > 0;

              return (
                <TableRow key={cat.categoryId}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/admin/contests/${contestId}/categories/${cat.categoryId}/rankings`}
                      className="flex items-center gap-1 hover:underline"
                    >
                      {cat.categoryName}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>{cat.divisionName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {cat.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{cat.submissionCount}</TableCell>
                  <TableCell className="text-center">{cat.reviewCount}</TableCell>
                  <TableCell className="text-center">{cat.rankingCount}</TableCell>
                  <TableCell>
                    {cat.judgingCompleted ? (
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    ) : (
                      <Badge variant="secondary">Incomplete</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {cat.approvedForWinners ? (
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {cat.approvedForWinners ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnapprove(cat.categoryId)}
                        disabled={unapproveMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(cat.categoryId)}
                        disabled={!canApprove || approveMutation.isPending}
                        title={
                          !cat.judgingCompleted
                            ? 'Judging not complete'
                            : cat.rankingCount === 0
                              ? 'No rankings submitted'
                              : undefined
                        }
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
