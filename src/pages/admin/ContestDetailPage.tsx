import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  ContestDetailsTab,
  DeleteContestButton,
  useContest,
} from '@/features/contests';
import type { ContestStatus } from '@/features/contests';
import { CategoriesTab } from '@/features/categories';

// Status colors per UX spec: ux-consistency-patterns.md
const statusConfig: Record<ContestStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
  published: { label: 'Published', className: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Closed', className: 'bg-amber-100 text-amber-800' },
  reviewed: { label: 'Reviewed', className: 'bg-purple-100 text-purple-800' },
  finished: { label: 'Finished', className: 'bg-green-100 text-green-800' },
};

/**
 * Contest detail page with tabs
 * Shows contest details, categories, codes, and judges tabs
 * Story: 2-4 (AC3)
 */
export function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const { data: contest, isLoading, error } = useContest(contestId!);

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
        <DeleteContestButton contestId={contest.id} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="codes">Codes</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <ContestDetailsTab contest={contest} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab contest={contest} />
        </TabsContent>

        <TabsContent value="codes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Participant Codes</CardTitle>
              <CardDescription>
                Participant code management will be implemented in Story 2.6
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This tab will allow you to generate and manage participant access
                codes for this contest.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="judges" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Judges</CardTitle>
              <CardDescription>
                Judge management will be implemented in Epic 3
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This tab will allow you to invite and manage judges assigned to
                this contest's categories.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
