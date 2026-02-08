import { useNavigate, useParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Calendar, CheckCircle2, ClipboardList, Eye, LogOut, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts'
import { useCategoriesByJudge, type CategoryWithContext } from '@/features/categories'
import { formatDateTimeInTimezone } from '@/lib/dateUtils'
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

export function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const {
    data: allCategories,
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

  // Loading state
  if (isLoading) {
    return <ContestDetailSkeleton />
  }

  // Error state
  if (error) {
    return <ContestDetailError error={error} onRetry={refetch} />
  }

  // Filter categories for this contest
  const categories = allCategories?.filter((c) => c.contestId === contestId) || []

  // Contest not found (data loaded but no matching categories)
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-destructive font-medium mb-2">Contest not found</p>
              <p className="text-sm text-muted-foreground mb-4">
                This contest doesn't exist or you don't have any categories assigned in it.
              </p>
              <Button onClick={() => navigate('/judge/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const contestName = categories[0].contestName
  const readyToReview = categories.filter((c) => c.status === 'closed' && !c.judgingCompletedAt).length
  const completed = categories.filter((c) => !!c.judgingCompletedAt).length

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/judge/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{contestName}</h1>
              <p className="text-muted-foreground">
                {categories.length} {categories.length === 1 ? 'category' : 'categories'} assigned
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
          <Card className={readyToReview > 0 ? 'border-primary bg-primary/5' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ready to Review</CardTitle>
              <Play className={`h-4 w-4 ${readyToReview > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${readyToReview > 0 ? 'text-primary' : ''}`}>
                {readyToReview}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Categories</h2>
          <div className="grid gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onStartReviewing={() => navigate(`/judge/categories/${category.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Category Card Component
interface CategoryCardProps {
  category: CategoryWithContext
  onStartReviewing: () => void
}

function CategoryCard({ category, onStartReviewing }: CategoryCardProps) {
  const isClosed = category.status === 'closed'
  const isCompleted = !!category.judgingCompletedAt

  const getDeadlineText = () => {
    if (isCompleted) return `Completed on ${new Date(category.judgingCompletedAt!).toLocaleDateString()}`
    if (isClosed) return 'Ready for review'
    if (!category.deadline) return 'Awaiting deadline'
    try {
      const deadlineDate = new Date(category.deadline)
      if (isNaN(deadlineDate.getTime())) return 'Awaiting deadline'
      const relativeTime = formatDistanceToNow(deadlineDate, { addSuffix: true })
      const absoluteTime = formatDateTimeInTimezone(category.deadline, category.contestTimezone)
      return `Deadline: ${absoluteTime} (${relativeTime})`
    } catch {
      return 'Awaiting deadline'
    }
  }
  const deadlineText = getDeadlineText()

  return (
    <Card className={isCompleted ? 'border-green-500 shadow-md' : isClosed ? 'border-primary shadow-md' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <CardDescription>{category.divisionName}</CardDescription>
          </div>
          <Badge
            variant={isCompleted ? 'default' : isClosed ? 'default' : 'secondary'}
            className={isCompleted ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isCompleted ? 'Complete' : isClosed ? 'Closed' : 'Published'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{deadlineText}</p>
            <p className="text-sm">
              <span className="font-medium">{category.submissionCount}</span> submissions
            </p>
          </div>
          <Button
            onClick={onStartReviewing}
            disabled={!isClosed && !isCompleted}
            variant={isClosed || isCompleted ? 'default' : 'outline'}
          >
            {isCompleted ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View Reviews
              </>
            ) : isClosed ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Reviewing
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Not Ready
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function ContestDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
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
  )
}

// Error State
interface ContestDetailErrorProps {
  error: Error
  onRetry: () => void
}

function ContestDetailError({ error, onRetry }: ContestDetailErrorProps) {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive font-medium mb-2">
              Failed to load contest
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
