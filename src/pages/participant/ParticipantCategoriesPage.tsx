import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  RefreshCw,
  Info,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Skeleton,
} from '@/components/ui'
import {
  ParticipantCategoryCard,
  SessionTimeoutWarning,
  useParticipantCategories,
  type ParticipantDivision,
  type ContestInfo,
} from '@/features/participants'
import { useParticipantSession } from '@/contexts'

/**
 * Participant categories page — redesigned as a two-step flow.
 * Step 1: Contest landing with hero image, description, rules, and division selection.
 * Step 2: Category list for the selected division.
 */
export function ParticipantCategoriesPage() {
  const navigate = useNavigate()
  const { session, showWarning, endSession, extendSession } = useParticipantSession()
  const [selectedDivision, setSelectedDivision] = useState<ParticipantDivision | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useParticipantCategories({
    contestId: session?.contestId || '',
    participantId: session?.participantId || '',
    participantCode: session?.code || '',
  })

  const divisions = data?.divisions
  const contest = data?.contest
  const contestFinished = data?.contestStatus === 'finished'

  // Auto-select when there's only one division
  useEffect(() => {
    if (divisions && divisions.length === 1 && !selectedDivision) {
      setSelectedDivision(divisions[0])
    }
  }, [divisions, selectedDivision])

  const handleLogout = () => {
    endSession()
    navigate('/enter', { replace: true })
  }

  if (!session) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 w-full" />
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 -mt-12">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

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
    )
  }

  const contestName = contest?.name || session?.contestName || 'Contest'

  return (
    <div className="min-h-screen bg-background">
      {selectedDivision === null ? (
        <div key="step1" className="animate-in fade-in duration-200">
          <Step1ContestLanding
            contest={contest}
            contestName={contestName}
            contestFinished={contestFinished}
            divisions={divisions || []}
            rulesOpen={rulesOpen}
            onRulesOpenChange={setRulesOpen}
            onSelectDivision={setSelectedDivision}
            onLogout={handleLogout}
          />
        </div>
      ) : (
        <div key="step2" className="animate-in fade-in slide-in-from-right-4 duration-200">
          <Step2CategoryList
            division={selectedDivision}
            contestFinished={contestFinished}
            onBack={() => setSelectedDivision(null)}
          />
        </div>
      )}

      <SessionTimeoutWarning
        open={showWarning}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
    </div>
  )
}

// ── Step 1: Contest Landing + Division Selection ──

interface Step1Props {
  contest: ContestInfo | null | undefined
  contestName: string
  contestFinished: boolean
  divisions: ParticipantDivision[]
  rulesOpen: boolean
  onRulesOpenChange: (open: boolean) => void
  onSelectDivision: (d: ParticipantDivision) => void
  onLogout: () => void
}

function Step1ContestLanding({
  contest,
  contestName,
  contestFinished,
  divisions,
  rulesOpen,
  onRulesOpenChange,
  onSelectDivision,
  onLogout,
}: Step1Props) {
  return (
    <>
      {/* Cover image (no gradient) */}
      {contest?.coverImageUrl && (
        <div className="h-48 sm:h-64 overflow-hidden">
          <img
            src={contest.coverImageUrl}
            alt={contestName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-8">
        {/* Logo */}
        {contest?.logoUrl && (
          <div className={contest?.coverImageUrl ? '-mt-10 mb-3' : 'mt-4 mb-3'}>
            <img
              src={contest.logoUrl}
              alt=""
              className="w-20 h-20 rounded-xl border-4 border-background bg-background object-cover"
            />
          </div>
        )}

        {/* Header row */}
        <div className={`flex items-start justify-between gap-4 mb-4${!contest?.logoUrl && !contest?.coverImageUrl ? ' mt-4' : ''}`}>
          <h1 className="text-3xl sm:text-4xl font-bold">{contestName}</h1>
          <Button variant="outline" size="sm" onClick={onLogout} className="shrink-0 mt-1">
            <LogOut className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>

        {/* Contest description */}
        {contest?.description && (
          <p className="text-muted-foreground mb-4">{contest.description}</p>
        )}

        {/* Contest rules (collapsible) */}
        {contest?.rules && (
          <Collapsible open={rulesOpen} onOpenChange={onRulesOpenChange} className="mb-6">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {rulesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Contest Rules
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 text-sm text-muted-foreground whitespace-pre-line pl-6">
              {contest.rules}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Finished contest banner */}
        {contestFinished && (
          <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg mb-6">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p>This contest has ended. View your feedback below.</p>
          </div>
        )}

        {/* Division selection */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {contestFinished ? 'Your Submissions' : 'Choose Your Division'}
          </h2>

          {divisions.length === 0 ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {divisions.map((division) => (
                <Card
                  key={division.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelectDivision(division)}
                >
                  <CardContent className="py-4 px-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{division.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {division.categories.length}{' '}
                        {division.categories.length === 1 ? 'category' : 'categories'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Step 2: Categories for Selected Division ──

interface Step2Props {
  division: ParticipantDivision
  contestFinished: boolean
  onBack: () => void
}

function Step2CategoryList({ division, contestFinished, onBack }: Step2Props) {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Header with back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{division.name}</h1>
        <Badge variant="secondary" className="text-xs">
          {division.categories.length}
        </Badge>
      </div>

      {/* Finished contest banner */}
      {contestFinished && (
        <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg">
          <Info className="h-5 w-5 flex-shrink-0" />
          <p>This contest has ended. View your feedback below.</p>
        </div>
      )}

      {/* Category cards */}
      <div className="space-y-3">
        {division.categories.map((category) => (
          <ParticipantCategoryCard
            key={category.id}
            category={category}
            contestFinished={contestFinished}
          />
        ))}
      </div>
    </div>
  )
}
