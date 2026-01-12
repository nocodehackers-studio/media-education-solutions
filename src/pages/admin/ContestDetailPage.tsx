import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

/**
 * Contest detail page placeholder
 * Will show contest details, categories, and participant codes
 * Story: 2-3 (placeholder), Full implementation in later stories
 */
export function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();

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
      <div>
        <h1 className="text-2xl font-semibold">Contest Details</h1>
        <p className="text-muted-foreground">Contest ID: {contestId}</p>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Contest detail view will be implemented in upcoming stories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will display:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Contest information and settings</li>
            <li>Categories and submission requirements</li>
            <li>Participant codes management</li>
            <li>Contest status and actions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
