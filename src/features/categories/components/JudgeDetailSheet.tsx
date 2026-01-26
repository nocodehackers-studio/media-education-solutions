// Story 3-5: JudgeDetailSheet component (AC5)
// Sheet showing detailed judge review status

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from '@/components/ui';
import { useJudgeProgress } from '../hooks/useJudgeProgress';

interface JudgeDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  judgeName: string;
  categoryId: string;
  categoryName: string;
}

export function JudgeDetailSheet({
  open,
  onOpenChange,
  judgeName,
  categoryId,
  categoryName,
}: JudgeDetailSheetProps) {
  const { data: progress, isLoading } = useJudgeProgress(categoryId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Judge Progress</SheetTitle>
          <SheetDescription>
            {judgeName} reviewing {categoryName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Submissions</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{progress?.total ?? 0}</p>
              )}
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Reviewed</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{progress?.reviewed ?? 0}</p>
              )}
            </div>
          </div>

          {/* Submission List Placeholder */}
          <div className="space-y-2">
            <h3 className="font-medium">Submissions</h3>
            <p className="text-sm text-muted-foreground">
              Detailed submission review status will be available once judging
              begins (Epic 5).
            </p>
            {/* TODO: Epic 5 - List submissions with reviewed/pending status
            <div className="space-y-2">
              {submissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 border rounded">
                  <span>Submission #{submission.id.slice(0, 8)}</span>
                  {submission.reviewed ? (
                    <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Reviewed</Badge>
                  ) : (
                    <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                  )}
                </div>
              ))}
            </div>
            */}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
