import { type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle2, ClipboardList, Eye, LogOut, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts'
import { useCategoriesByJudge, type CategoryWithContext } from '@/features/categories'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'

interface ContestGroup {
  contestName: string
  categories: CategoryWithContext[]
}

function groupByContest(categories: CategoryWithContext[]): Map<string, ContestGroup> {
  const map = new Map<string, ContestGroup>()
  for (const cat of categories) {
    const existing = map.get(cat.contestId)
    if (existing) {
      existing.categories.push(cat)
    } else {
      map.set(cat.contestId, { contestName: cat.contestName, categories: [cat] })
    }
  }
  return map
}

export function JudgeDashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useCategoriesByJudge(user?.id)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign out')
    }
  }

  // Stats
  const totalCategories = categories?.length || 0
  const completedCategories =
    categories?.filter((c) => !!c.judgingCompletedAt).length || 0
  const closedCategories =
    categories?.filter((c) => c.status === 'closed' && !c.judgingCompletedAt).length || 0
  const awaitingCategories =
    categories?.filter((c) => c.status === 'published').length || 0

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Error state
  if (error) {
    return <DashboardError error={error} onRetry={refetch} />
  }

  const contestGroups = groupByContest(categories || [])

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
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
            title="Completed"
            value={completedCategories}
            icon={CheckCircle2}
          />
          <StatCard
            title="Awaiting Deadline"
            value={awaitingCategories}
            icon={Calendar}
          />
        </div>

        {/* Contests List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Contests</h2>

          {/* Empty State */}
          {contestGroups.size === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No contests assigned yet
                </p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  You'll see your assigned contests here once an admin assigns
                  you
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {Array.from(contestGroups.entries()).map(([contestId, group]) => (
                <ContestCard
                  key={contestId}
                  contestId={contestId}
                  contestName={group.contestName}
                  categories={group.categories}
                  onViewCategories={() => navigate(`/judge/contests/${contestId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: number
  icon: ComponentType<{ className?: string }>
  highlight?: boolean
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
  )
}

// Contest Card Component
interface ContestCardProps {
  contestId: string
  contestName: string
  categories: CategoryWithContext[]
  onViewCategories: () => void
}

function ContestCard({ contestName, categories, onViewCategories }: ContestCardProps) {
  const totalSubmissions = categories.reduce((sum, c) => sum + c.submissionCount, 0)
  const readyToReview = categories.filter((c) => c.status === 'closed' && !c.judgingCompletedAt).length
  const completed = categories.filter((c) => !!c.judgingCompletedAt).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{contestName}</CardTitle>
            <CardDescription>
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} assigned
            </CardDescription>
          </div>
          {readyToReview > 0 && (
            <Badge variant="default">
              {readyToReview} ready
            </Badge>
          )}
          {readyToReview === 0 && completed === categories.length && (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">{totalSubmissions}</span> total submissions
            </p>
            {readyToReview > 0 && (
              <p className="text-sm text-primary">
                {readyToReview} {readyToReview === 1 ? 'category' : 'categories'} ready to review
              </p>
            )}
          </div>
          <Button onClick={onViewCategories}>
            <Eye className="mr-2 h-4 w-4" />
            View Categories
          </Button>
        </div>
      </CardContent>
    </Card>
  )
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
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
  )
}

// Error State
interface DashboardErrorProps {
  error: Error
  onRetry: () => void
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
  )
}
