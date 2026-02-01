// Story 4-3: Participant categories page with submission status
// Story 6-7: Added finished contest behavior with feedback banner and disabled categories
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Info } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Skeleton,
} from '@/components/ui';
import {
  ParticipantCategoryCard,
  SessionTimeoutWarning,
  useParticipantCategories,
} from '@/features/participants';
import { useParticipantSession } from '@/contexts';

/**
 * Participant categories page - displays available categories for submission.
 * Shows category cards with deadline countdowns and submission status.
 */
export function ParticipantCategoriesPage() {
  const navigate = useNavigate();
  const { session, showWarning, endSession, extendSession } = useParticipantSession();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useParticipantCategories({
    contestId: session?.contestId || '',
    participantId: session?.participantId || '',
    participantCode: session?.code || '',
  });

  const categories = data?.categories;
  const contestFinished = data?.contestStatus === 'finished';

  const handleLogout = () => {
    endSession();
    navigate('/enter', { replace: true });
  };

  // F11: Handle null session (ParticipantRoute should redirect, but guard anyway)
  if (!session) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">Failed to load categories</p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {session?.contestName || 'Contest'}
            </h1>
            <p className="text-muted-foreground">
              Welcome, {session?.name || 'Participant'}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>

        {/* Story 6-7: Finished contest banner */}
        {contestFinished && (
          <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p>This contest has ended. View your feedback below.</p>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {contestFinished ? 'Your Submissions' : 'Available Categories'}
          </h2>

          {categories?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {contestFinished
                    ? 'No categories available.'
                    : 'No categories are currently accepting submissions.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            categories?.map((category) => (
              <ParticipantCategoryCard
                key={category.id}
                category={category}
                contestFinished={contestFinished}
              />
            ))
          )}
        </div>
      </div>

      {/* Session timeout warning */}
      <SessionTimeoutWarning
        open={showWarning}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
    </div>
  );
}
