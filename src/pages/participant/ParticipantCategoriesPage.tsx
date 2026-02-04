// Story 4-3: Participant categories page with submission status
// Story 6-7: Added finished contest behavior with feedback banner and disabled categories
// WS5: Division grouping with collapsible sections
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Info, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
} from '@/components/ui';
import {
  ParticipantCategoryCard,
  SessionTimeoutWarning,
  useParticipantCategories,
  type ParticipantDivision,
} from '@/features/participants';
import { useParticipantSession } from '@/contexts';

interface DivisionSectionProps {
  division: ParticipantDivision;
  contestFinished: boolean;
  collapsible: boolean;
}

function DivisionSection({ division, contestFinished, collapsible }: DivisionSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!collapsible) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 pl-1">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{division.name}</span>
          <Badge variant="secondary" className="text-xs">
            {division.categories.length}
          </Badge>
        </div>
        <div className="space-y-3 border-l-2 border-muted pl-4">
          {division.categories.map((category) => (
            <ParticipantCategoryCard
              key={category.id}
              category={category}
              contestFinished={contestFinished}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{division.name}</span>
          <Badge variant="secondary" className="text-xs">
            {division.categories.length}
          </Badge>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-l-2 border-muted pl-4">
        {division.categories.map((category) => (
          <ParticipantCategoryCard
            key={category.id}
            category={category}
            contestFinished={contestFinished}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Participant categories page - displays available categories for submission.
 * Shows category cards with deadline countdowns and submission status.
 * Categories are grouped by division with collapsible sections.
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

  const divisions = data?.divisions;
  const contestFinished = data?.contestStatus === 'finished';
  const hasMultipleDivisions = (divisions?.length ?? 0) > 1;

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
              Welcome, Participant
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

        {/* Categories List — grouped by division */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {contestFinished ? 'Your Submissions' : 'Available Categories'}
          </h2>

          {!divisions || divisions.length === 0 ? (
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
            <div className="space-y-6">
              {divisions.map((division) => (
                <DivisionSection
                  key={division.id}
                  division={division}
                  contestFinished={contestFinished}
                  collapsible={hasMultipleDivisions}
                />
              ))}
            </div>
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
