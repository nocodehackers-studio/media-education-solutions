import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  RefreshCw,
  Info,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  CircleCheck,
  CircleX,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Separator,
  Skeleton,
} from '@/components/ui'
import {
  ParticipantCategoryCard,
  ParticipantUserMenu,
  SessionTimeoutWarning,
  useParticipantCategories,
  type ParticipantDivision,
  type ContestInfo,
} from '@/features/participants'
import { useParticipantSession } from '@/contexts'

const DIVISION_STORAGE_KEY = 'participant_selected_division'

/**
 * Participant categories page — redesigned as a two-step flow.
 * Step 1: Contest landing with hero image, description, rules, and division/category list.
 * Step 2: Category list for the selected division (multi-division only).
 */
export function ParticipantCategoriesPage() {
  const navigate = useNavigate()
  const { session, showWarning, endSession, extendSession } = useParticipantSession()
  // Store division ID in state, initialized from sessionStorage
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(
    () => sessionStorage.getItem(DIVISION_STORAGE_KEY)
  )
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
  const acceptingSubmissions = data?.acceptingSubmissions ?? false
  const contestFinished = data?.contestStatus === 'finished'
  const contestClosed = data?.contestStatus === 'closed' || data?.contestStatus === 'reviewed'
  const isSingleDivision = (divisions?.length ?? 0) === 1

  // Derive selected division from ID when divisions data is available
  const selectedDivision = useMemo(() => {
    if (!divisions || isSingleDivision || !selectedDivisionId) return null
    const found = divisions.find((d) => d.id === selectedDivisionId)
    if (!found && selectedDivisionId) {
      // Clean up invalid stored ID
      sessionStorage.removeItem(DIVISION_STORAGE_KEY)
    }
    return found ?? null
  }, [divisions, selectedDivisionId, isSingleDivision])

  const handleSelectDivision = (division: ParticipantDivision) => {
    sessionStorage.setItem(DIVISION_STORAGE_KEY, division.id)
    setSelectedDivisionId(division.id)
  }

  const handleBack = () => {
    sessionStorage.removeItem(DIVISION_STORAGE_KEY)
    setSelectedDivisionId(null)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(DIVISION_STORAGE_KEY)
    endSession()
    navigate('/', { replace: true })
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
    const isContestUnavailable = error.message?.includes('CONTEST_NOT_AVAILABLE') || (error as { code?: string }).code === 'CONTEST_NOT_AVAILABLE'
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              {isContestUnavailable ? (
                <>
                  <p className="text-muted-foreground mb-4">This contest is no longer available.</p>
                  <Button onClick={() => { endSession(); navigate('/', { replace: true }) }}>
                    Return to Code Entry
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-destructive mb-4">Failed to load categories</p>
                  <Button onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const contestName = contest?.name || session?.contestName || 'Contest'

  return (
    <div className="min-h-screen bg-background">
      {!isSingleDivision && selectedDivision !== null ? (
        <div key="step2" className="animate-in fade-in slide-in-from-right-4 duration-200">
          <Step2CategoryList
            division={selectedDivision}
            contestFinished={contestFinished}
            contestClosed={contestClosed}
            acceptingSubmissions={acceptingSubmissions}
            onBack={handleBack}
          />
        </div>
      ) : (
        <div key="step1" className="animate-in fade-in duration-200">
          <Step1ContestLanding
            contest={contest}
            contestName={contestName}
            contestFinished={contestFinished}
            contestClosed={contestClosed}
            acceptingSubmissions={acceptingSubmissions}
            divisions={divisions || []}
            rulesOpen={rulesOpen}
            onRulesOpenChange={setRulesOpen}
            onSelectDivision={handleSelectDivision}
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

// ── Step 1: Contest Landing + Division/Category Selection ──

interface Step1Props {
  contest: ContestInfo | null | undefined
  contestName: string
  contestFinished: boolean
  contestClosed: boolean
  acceptingSubmissions: boolean
  divisions: ParticipantDivision[]
  rulesOpen: boolean
  onRulesOpenChange: (open: boolean) => void
  onSelectDivision: (d: ParticipantDivision) => void
}

function Step1ContestLanding({
  contest,
  contestName,
  contestFinished,
  contestClosed,
  acceptingSubmissions,
  divisions,
  rulesOpen,
  onRulesOpenChange,
  onSelectDivision,
}: Step1Props) {
  const isSingleDivision = divisions.length === 1

  return (
    <>
      {/* Cover image */}
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
              className="-ml-1 w-20 h-20 rounded-xl border-4 border-background bg-background object-cover"
            />
          </div>
        )}

        {/* Title row with user menu */}
        <div className={`flex items-end justify-between gap-4 mb-3${!contest?.logoUrl && !contest?.coverImageUrl ? ' mt-4' : ''}`}>
          <h1 className="text-3xl sm:text-4xl font-bold">{contestName}</h1>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground mb-1">Logged in as</p>
            <ParticipantUserMenu />
          </div>
        </div>

        {/* Contest status */}
        <div className="mb-4">
          {acceptingSubmissions ? (
            <Badge variant="default" className="bg-green-600 text-xs">
              <CircleCheck className="h-3 w-3 mr-1" />
              Accepting Submissions
            </Badge>
          ) : contestClosed ? (
            <Badge variant="secondary" className="text-xs">
              <CircleX className="h-3 w-3 mr-1" />
              Contest is Closed
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <CircleX className="h-3 w-3 mr-1" />
              Contest Ended
            </Badge>
          )}
        </div>

        {/* Contest description */}
        {contest?.description && (
          <div className="text-muted-foreground mb-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contest.description) }} />
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
            <CollapsibleContent className="mt-2 text-sm text-muted-foreground pl-6">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contest.rules) }} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Divider */}
        <Separator className="mb-6" />

        {/* Contest closed banner */}
        {contestClosed && (
          <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg mb-6">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p>This contest is closed. Submissions are no longer accepted.</p>
          </div>
        )}

        {/* Finished contest banner */}
        {contestFinished && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p>This contest has ended. View your feedback below.</p>
            </div>
            {divisions?.some((d) => d.categories.some((c) => c.hasFeedback)) && (
              <div className="flex items-center gap-2 text-primary bg-primary/10 p-4 rounded-lg">
                <CircleCheck className="h-5 w-5 flex-shrink-0" />
                <p>Feedback is available for your submissions.</p>
              </div>
            )}
          </div>
        )}

        {/* Categories / Division selection */}
        <div className="space-y-4">
          {isSingleDivision ? (
            <>
              <h2 className="text-lg font-semibold">
                {contestFinished ? 'Your Submissions' : 'Categories'}
              </h2>
              {divisions[0].categories.length === 0 ? (
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
                <div className="space-y-3">
                  {divisions[0].categories.map((category) => (
                    <ParticipantCategoryCard
                      key={category.id}
                      category={category}
                      contestFinished={contestFinished}
                      acceptingSubmissions={acceptingSubmissions}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ── Step 2: Categories for Selected Division (multi-division only) ──

interface Step2Props {
  division: ParticipantDivision
  contestFinished: boolean
  contestClosed: boolean
  acceptingSubmissions: boolean
  onBack: () => void
}

function Step2CategoryList({ division, contestFinished, contestClosed, acceptingSubmissions, onBack }: Step2Props) {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Header with back + user menu */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{division.name}</h1>
        <Badge variant="secondary" className="text-xs">
          {division.categories.length}
        </Badge>
        <div className="ml-auto">
          <ParticipantUserMenu />
        </div>
      </div>

      {/* Contest closed banner */}
      {contestClosed && (
        <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg">
          <Info className="h-5 w-5 flex-shrink-0" />
          <p>This contest is closed. Submissions are no longer accepted.</p>
        </div>
      )}

      {/* Finished contest banner */}
      {contestFinished && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground bg-muted p-4 rounded-lg">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p>This contest has ended. View your feedback below.</p>
          </div>
          {division.categories.some((c) => c.hasFeedback) && (
            <div className="flex items-center gap-2 text-primary bg-primary/10 p-4 rounded-lg">
              <CircleCheck className="h-5 w-5 flex-shrink-0" />
              <p>Feedback is available for your submissions.</p>
            </div>
          )}
        </div>
      )}

      {/* Category cards */}
      <div className="space-y-3">
        {division.categories.map((category) => (
          <ParticipantCategoryCard
            key={category.id}
            category={category}
            contestFinished={contestFinished}
            acceptingSubmissions={acceptingSubmissions}
          />
        ))}
      </div>
    </div>
  )
}
