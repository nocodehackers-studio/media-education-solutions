import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
} from '@/components/ui';
import { ContestCard, CreateContestForm, useContests } from '@/features/contests';

/**
 * Contests page - List and manage contests
 * Shows empty state or contest cards with create functionality
 */
export function ContestsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { data: contests, isLoading, error } = useContests();

  const handleSuccess = () => {
    setIsSheetOpen(false);
  };

  const handleContestClick = (contestId: string) => {
    navigate(`/admin/contests/${contestId}`);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contests</h1>
            <p className="text-muted-foreground">Manage your contests</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">Failed to load contests</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contests</h1>
          <p className="text-muted-foreground">Manage your contests</p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create Contest</SheetTitle>
              <SheetDescription>
                Set up a new contest with basic details. You can generate participant codes
                after the contest is created.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <CreateContestForm onSuccess={handleSuccess} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && contests && contests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No contests yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              You haven't created any contests yet. Create your first contest to start accepting submissions from participants.
            </p>
            <Button onClick={() => setIsSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contests List */}
      {!isLoading && contests && contests.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              onClick={handleContestClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
