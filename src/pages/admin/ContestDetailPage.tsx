import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, BarChart3, Layers, Users, Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
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
  CodesTab,
  DeleteContestButton,
  EditContestForm,
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
import {
  useAdminSubmissions,
  formatSubmissionDate,
  SUBMISSION_STATUS_VARIANT,
} from '@/features/submissions';

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
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ContestStatus | null>(null);
  const updateStatus = useUpdateContestStatus();
  const stats = useContestDetailStats(contestId!);
  const { data: submissions, isLoading: submissionsLoading } = useAdminSubmissions(contestId!);

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
          <Button variant="link" size="sm" className="text-muted-foreground px-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contests
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{contest.name}</h1>
          <p className="text-muted-foreground font-mono mt-1">{contest.contestCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditSheetOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Select
            value={currentStatus}
            onValueChange={(value) => handleStatusChange(value as ContestStatus)}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger
              className="w-[140px] h-8 text-sm font-medium"
              data-testid="status-select"
            >
              <span className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full shrink-0', status.dotColor)} />
                <SelectValue />
              </span>
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

      {/* Edit Contest Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Contest</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <EditContestForm
              contest={contest}
              onSuccess={() => setEditSheetOpen(false)}
              onCancel={() => setEditSheetOpen(false)}
            />
          </div>
          <div className="mt-auto pt-10">
            <Separator />
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <DeleteContestButton contestId={contest.id} />
              <p className="text-xs text-muted-foreground">
                Deleting a contest is permanent and cannot be undone. All associated data including categories, submissions, codes, and judge assignments will be removed.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="categories">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger value="categories" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">Divisions & Categories</TabsTrigger>
            <TabsTrigger value="codes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">Codes</TabsTrigger>
            <TabsTrigger value="judges" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">Judges</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">Notifications</TabsTrigger>
            <TabsTrigger
              value="winners"
              disabled={contest.status !== 'finished'}
              title={contest.status !== 'finished' ? 'This will be available once the contest is finished.' : undefined}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
            >
              Winners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-0 p-6">
            <CategoriesTab contest={contest} />
          </TabsContent>

          <TabsContent value="codes" className="mt-0 p-6">
            <CodesTab contest={contest} />
          </TabsContent>

          <TabsContent value="judges" className="mt-0 p-6">
            <JudgesTab contestId={contest.id} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Summary of notifications sent for this contest
                </p>
                <Button
                  variant="outline"
                  onClick={() => setLogsSheetOpen(true)}
                >
                  View All Logs
                </Button>
              </div>
              <NotificationSummary contestId={contest.id} />
            </div>
          </TabsContent>

          <TabsContent value="winners" className="mt-0 p-6">
            {contest.status === 'finished' ? (
              <AdminWinnersTab contest={contest} />
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  Winners management will be available once the contest is finished.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Latest Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Latest Submissions</CardTitle>
          <Link to={`/admin/contests/${contest.id}/submissions`}>
            <Button variant="outline" size="sm">
              View All Submissions
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {submissionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No submissions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Code</th>
                    <th className="pb-2 pr-4 font-medium">Participant</th>
                    <th className="pb-2 pr-4 font-medium hidden md:table-cell">Category</th>
                    <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Media</th>
                    <th className="pb-2 pr-4 font-medium hidden lg:table-cell">Submitted</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 10).map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{s.participantCode}</td>
                      <td className="py-2 pr-4">{s.participantName || '—'}</td>
                      <td className="py-2 pr-4 hidden md:table-cell">{s.categoryName}</td>
                      <td className="py-2 pr-4 hidden sm:table-cell capitalize">{s.mediaType}</td>
                      <td className="py-2 pr-4 hidden lg:table-cell text-muted-foreground">
                        {formatSubmissionDate(s.submittedAt)}
                      </td>
                      <td className="py-2">
                        <Badge variant={SUBMISSION_STATUS_VARIANT[s.status] ?? 'secondary'}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
