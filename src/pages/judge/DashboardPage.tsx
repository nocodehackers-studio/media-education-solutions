// JudgeDashboardPage - Story 3-4
// Shows judge's assigned categories with status and submission counts

import { type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, ClipboardList, LogOut, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts';
import { useCategoriesByJudge, type CategoryWithContext } from '@/features/categories';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui';

export function JudgeDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useCategoriesByJudge(user?.id);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  // Stats
  const totalCategories = categories?.length || 0;
  const closedCategories =
    categories?.filter((c) => c.status === 'closed').length || 0;
  const awaitingCategories =
    categories?.filter((c) => c.status === 'published').length || 0;

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return <DashboardError error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome, {user?.firstName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-muted-foreground">
              Review submissions for your assigned categories
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Assigned Categories"
            value={totalCategories}
            icon={ClipboardList}
          />
          <StatCard
            title="Ready to Review"
            value={closedCategories}
            icon={Play}
            highlight
          />
          <StatCard
            title="Awaiting Deadline"
            value={awaitingCategories}
            icon={Calendar}
          />
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Categories</h2>

          {/* Empty State (AC5) */}
          {totalCategories === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No categories assigned yet
                </p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  You'll see your assigned categories here once an admin assigns
                  you
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {categories?.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onStartReviewing={() => {
                    // TODO: Navigate to /judge/categories/:id when review page is implemented
                    toast.info('Review page coming soon!');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  highlight?: boolean;
}

function StatCard({ title, value, icon: Icon, highlight }: StatCardProps) {
  return (
    <Card className={highlight && value > 0 ? 'border-primary bg-primary/5' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={`h-4 w-4 ${highlight && value > 0 ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${highlight && value > 0 ? 'text-primary' : ''}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

// Category Card Component (AC2, AC3, AC4)
interface CategoryCardProps {
  category: CategoryWithContext;
  onStartReviewing: () => void;
}

function CategoryCard({ category, onStartReviewing }: CategoryCardProps) {
  const isClosed = category.status === 'closed';

  // Defensive date handling - deadline should always exist but guard against edge cases
  const getDeadlineText = () => {
    if (isClosed) return 'Ready for review';
    if (!category.deadline) return 'Awaiting deadline';
    try {
      const deadlineDate = new Date(category.deadline);
      if (isNaN(deadlineDate.getTime())) return 'Awaiting deadline';
      return `Awaiting deadline: ${formatDistanceToNow(deadlineDate, { addSuffix: true })}`;
    } catch {
      return 'Awaiting deadline';
    }
  };
  const deadlineText = getDeadlineText();

  return (
    <Card className={isClosed ? 'border-primary shadow-md' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <CardDescription>
              {category.contestName} &bull; {category.divisionName}
            </CardDescription>
          </div>
          <Badge variant={isClosed ? 'default' : 'secondary'}>
            {isClosed ? 'Closed' : 'Published'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{deadlineText}</p>
            <p className="text-sm">
              <span className="font-medium">{category.submissionCount}</span>{' '}
              submissions
            </p>
          </div>
          <Button
            onClick={onStartReviewing}
            disabled={!isClosed}
            variant={isClosed ? 'default' : 'outline'}
          >
            <Play className="mr-2 h-4 w-4" />
            {isClosed ? 'Start Reviewing' : 'Not Ready'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Error State
interface DashboardErrorProps {
  error: Error;
  onRetry: () => void;
}

function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive font-medium mb-2">
              Failed to load dashboard
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={onRetry}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
