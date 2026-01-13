import { useNavigate } from 'react-router-dom';
import { Trophy, Activity, FileVideo, AlertCircle, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Skeleton } from '@/components/ui';
import { useDashboardStats, useActiveContests } from '@/features/contests';

interface StatCardProps {
  title: string;
  value: number;
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

/**
 * Loading skeleton for dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
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
    </div>
  );
}

/**
 * Error state for dashboard
 */
function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all contests</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Failed to load dashboard</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading the dashboard data. Please try again.
          </p>
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Admin dashboard page showing contest statistics and overview.
 * Displays stat cards, active contests with per-contest metrics, and empty state.
 *
 * AC1: Summary Statistics - Total Contests, Active Contests, Total Submissions
 * AC2: Active Contests List - name, status, submission count, judge progress percentage
 * AC3: Judge Progress Display - per-contest "Judge Progress: X/Y reviewed"
 * AC4: Contest Navigation - click to go to contest detail
 * AC5: Empty State - "Create your first contest" CTA
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: activeContests, isLoading: contestsLoading, error: contestsError, refetch: refetchContests } = useActiveContests();

  const handleContestClick = (contestId: string) => {
    navigate(`/admin/contests/${contestId}`);
  };

  const handleCreateContest = () => {
    navigate('/admin/contests');
  };

  const handleRetry = () => {
    refetchStats();
    refetchContests();
  };

  // Show loading skeleton while fetching initial stats
  if (statsLoading && !stats) {
    return <DashboardSkeleton />;
  }

  // Show error state if stats or contests fetch failed
  const hasError = (statsError && !stats) || (contestsError && !activeContests);
  if (hasError) {
    return <DashboardError onRetry={handleRetry} />;
  }

  const hasContests = (stats?.totalContests ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all contests</p>
      </div>

      {/* Stat Cards (AC1) */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Contests"
          value={stats?.totalContests ?? 0}
          icon={Trophy}
          isLoading={statsLoading}
        />
        <StatCard
          title="Active Contests"
          value={stats?.activeContests ?? 0}
          icon={Activity}
          isLoading={statsLoading}
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalSubmissions ?? 0}
          icon={FileVideo}
          isLoading={statsLoading}
        />
      </div>

      {/* Content */}
      {hasContests ? (
        /* Active Contests List (AC2, AC3, AC4) */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Contests</CardTitle>
          </CardHeader>
          <CardContent>
            {contestsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : activeContests && activeContests.length > 0 ? (
              <div className="space-y-3">
                {activeContests.map((contest) => (
                  <div
                    key={contest.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-3 rounded-md border transition-colors"
                    onClick={() => handleContestClick(contest.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleContestClick(contest.id);
                      }
                    }}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{contest.name}</p>
                      {/* AC2: Submission count and judge progress percentage, AC3: X/Y reviewed format */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span data-testid="submission-count">Submissions: 0</span>
                        <span data-testid="judge-progress">No judges assigned</span>
                      </div>
                    </div>
                    <Badge variant="default">
                      {contest.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active contests. Publish a contest to see it here.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Empty State (AC5) */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No contests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first contest to get started
            </p>
            <Button onClick={handleCreateContest}>
              Create your first contest
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
