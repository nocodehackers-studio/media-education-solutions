import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, BarChart3, Layers, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
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
import { cn } from '@/lib/utils';
import {
  ContestDetailsTab,
  CodesTab,
  AdminWinnersTab,
  useContest,
  useUpdateContestStatus,
  useContestDetailStats,
} from '@/features/contests';
import type { ContestStatus } from '@/features/contests';
import { CategoriesTab, JudgesTab } from '@/features/categories';
import {
  NotificationSummary,
  NotificationLogsTable,
} from '@/features/notifications';

// Status colors per UX spec: ux-consistency-patterns.md
const statusConfig: Record<ContestStatus, { label: string; className: string; dotColor: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-500' },
  published: { label: 'Published', className: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' },
  closed: { label: 'Closed', className: 'bg-amber-100 text-amber-800', dotColor: 'bg-amber-500' },
  reviewed: { label: 'Reviewed', className: 'bg-purple-100 text-purple-800', dotColor: 'bg-purple-500' },
  finished: { label: 'Finished', className: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
};

const statusOptions: { value: ContestStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'finished', label: 'Finished' },
];

// --- Stat card helpers ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

interface JudgingProgressCardProps {
  percent: number;
  categoriesJudged: number;
  categoryCount: number;
  isLoading?: boolean;
}

function JudgingProgressCard({ percent, categoriesJudged, categoryCount, isLoading }: JudgingProgressCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Judging Progress</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-2xl font-bold">{percent}%</div>
            <Progress value={percent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {categoriesJudged} of {categoryCount} categories
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CodesStatCardProps {
  codesUsed: number;
  codesTotal: number;
  isLoading?: boolean;
}

function CodesStatCard({ codesUsed, codesTotal, isLoading }: CodesStatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Codes Used</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">
            {codesUsed} / {codesTotal}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
  const stats = useContestDetailStats(contestId!);

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
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-[140px] rounded-full" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Tab area skeleton */}
        <Skeleton className="h-10 w-full max-w-xl" />
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

  const currentStatus = pendingStatus ?? contest.status;
  const status = statusConfig[currentStatus];

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
          <h1 className="text-2xl font-semibold">{contest.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground font-mono">{contest.contestCode}</p>
            <Link to={`/admin/contests/${contest.id}/submissions`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <FileText className="h-3 w-3 mr-1" />
                View Submissions
              </Button>
            </Link>
          </div>
        </div>
        <Select
          value={currentStatus}
          onValueChange={(value) => handleStatusChange(value as ContestStatus)}
          disabled={updateStatus.isPending}
        >
          <SelectTrigger
            className={cn(
              'w-[140px] rounded-full border-0 font-medium',
              status.className
            )}
            data-testid="status-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', statusConfig[option.value].dotColor)} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mini-dashboard stat cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          title="Submissions"
          value={stats.totalSubmissions}
          icon={FileText}
          isLoading={stats.isLoading}
        />
        <JudgingProgressCard
          percent={stats.judgingProgressPercent}
          categoriesJudged={stats.categoriesJudged}
          categoryCount={stats.categoryCount}
          isLoading={stats.isLoading}
        />
        <StatCard
          title="Categories"
          value={stats.categoryCount}
          icon={Layers}
          isLoading={stats.isLoading}
        />
        <CodesStatCard
          codesUsed={stats.codesUsed}
          codesTotal={stats.codesTotal}
          isLoading={stats.isLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="categories">Divisions & Categories</TabsTrigger>
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
