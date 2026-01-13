import { useNavigate } from 'react-router-dom';
import { Trophy, Activity, FileVideo, Users, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Skeleton } from '@/components/ui';
import { useDashboardStats, useRecentContests } from '@/features/contests';

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
 * Admin dashboard page showing contest statistics and overview.
 * Displays stat cards, recent contests, and judge progress.
 *
 * AC1: Summary Statistics - Total Contests, Active Contests, Total Submissions
 * AC2: Active Contests List - name, status, submission count, judge progress
 * AC3: Judge Progress Display - placeholder until Epic 3
 * AC4: Contest Navigation - click to go to contest detail
 * AC5: Empty State - "Create your first contest" CTA
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentContests, isLoading: contestsLoading } = useRecentContests(5);

  const handleContestClick = (contestId: string) => {
    navigate(`/admin/contests/${contestId}`);
  };

  const handleCreateContest = () => {
    navigate('/admin/contests');
  };

  // Show loading skeleton while fetching initial stats
  if (statsLoading && !stats) {
    return <DashboardSkeleton />;
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
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Contests (AC2, AC4) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Contests</CardTitle>
            </CardHeader>
            <CardContent>
              {contestsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentContests?.map((contest) => (
                    <div
                      key={contest.id}
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                      onClick={() => handleContestClick(contest.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleContestClick(contest.id);
                        }
                      }}
                    >
                      <div>
                        <p className="font-medium">{contest.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contest.contestCode}
                        </p>
                      </div>
                      <Badge variant={contest.status === 'published' ? 'default' : 'secondary'}>
                        {contest.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Judge Progress (AC3) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Judge Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>No judges assigned yet</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Judge assignments available in Epic 3
              </p>
            </CardContent>
          </Card>
        </div>
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
