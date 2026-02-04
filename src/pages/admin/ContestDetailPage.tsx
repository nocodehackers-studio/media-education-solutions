import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@/components/ui';
import {
  ContestDetailsTab,
  CodesTab,
  AdminWinnersTab,
  useContest,
  useUpdateContestStatus,
} from '@/features/contests';
import type { ContestStatus } from '@/features/contests';
import { CategoriesTab, JudgesTab } from '@/features/categories';
import { DivisionList } from '@/features/divisions';
import {
  NotificationSummary,
  NotificationLogsTable,
} from '@/features/notifications';

// Status colors per UX spec: ux-consistency-patterns.md
const statusConfig: Record<ContestStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  published: { label: 'Published', className: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Closed', className: 'bg-amber-100 text-amber-800' },
  reviewed: { label: 'Reviewed', className: 'bg-purple-100 text-purple-800' },
  finished: { label: 'Finished', className: 'bg-green-100 text-green-800' },
};

const statusOptions: { value: ContestStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'finished', label: 'Finished' },
];

/**
 * Contest detail page with tabs
 * Shows contest details, categories, codes, and judges tabs
 * Story: 2-4 (AC3)
 */
export function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const { data: contest, isLoading, error } = useContest(contestId!);
  const [logsSheetOpen, setLogsSheetOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ContestStatus | null>(null);
  const updateStatus = useUpdateContestStatus();

  const handleStatusChange = async (newStatus: ContestStatus) => {
    if (!contest) return;
    setPendingStatus(newStatus);
    try {
      await updateStatus.mutateAsync({ id: contest.id, status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      );
    } finally {
      setPendingStatus(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Link to="/admin/contests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contests
            </Button>
          </Link>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="space-y-6">
        <div>
          <Link to="/admin/contests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contests
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">
              {error ? 'Failed to load contest' : 'Contest not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[contest.status];

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back Navigation */}
      <div>
        <Link to="/admin/contests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contests
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{contest.name}</h1>
            <Badge className={status.className} variant="secondary">
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono">{contest.contestCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/admin/contests/${contest.id}/submissions`}>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Submissions
            </Button>
          </Link>
          <Select
            value={pendingStatus ?? contest.status}
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
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="codes">Codes</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {(contest.status === 'reviewed' || contest.status === 'finished') && (
            <TabsTrigger value="winners">Winners</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <ContestDetailsTab contest={contest} />
        </TabsContent>

        <TabsContent value="divisions" className="mt-6">
          <DivisionList contestId={contest.id} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab contest={contest} />
        </TabsContent>

        <TabsContent value="codes" className="mt-6">
          <CodesTab contest={contest} />
        </TabsContent>

        <TabsContent value="judges" className="mt-6">
          <JudgesTab contestId={contest.id} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="space-y-4">
            <NotificationSummary contestId={contest.id} />
            <Button
              variant="outline"
              onClick={() => setLogsSheetOpen(true)}
            >
              View All Notifications
            </Button>
          </div>
        </TabsContent>

        {(contest.status === 'reviewed' || contest.status === 'finished') && (
          <TabsContent value="winners" className="mt-6">
            <AdminWinnersTab contest={contest} />
          </TabsContent>
        )}
      </Tabs>

      {/* Notification Logs Sheet */}
      <Sheet open={logsSheetOpen} onOpenChange={setLogsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Notification Logs</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <NotificationLogsTable contestId={contest.id} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
