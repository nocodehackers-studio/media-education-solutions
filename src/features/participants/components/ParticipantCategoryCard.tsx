import { useNavigate } from 'react-router-dom'
import { Video, Image, CheckCircle, Clock, ChevronRight, Ban } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import { DeadlineCountdown } from './DeadlineCountdown'
import { cn } from '@/lib/utils'
import { type ParticipantCategory } from '../api/participantsApi'

export type { ParticipantCategory } from '../api/participantsApi'

interface ParticipantCategoryCardProps {
  category: ParticipantCategory
  contestFinished?: boolean
  acceptingSubmissions?: boolean
}

export function ParticipantCategoryCard({ category, contestFinished, acceptingSubmissions = true }: ParticipantCategoryCardProps) {
  const navigate = useNavigate()
  const isClosed = category.status === 'closed'
  const isDisabled = contestFinished && category.noSubmission
  const isContestClosed = acceptingSubmissions === false && !contestFinished
  const TypeIcon = category.type === 'video' ? Video : Image

  const handleClick = () => {
    if (isDisabled) return
    if (isContestClosed) return
    navigate(`/participant/category/${category.id}`, {
      state: { category, contestFinished, acceptingSubmissions },
    })
  }

  return (
    <Card
      className={cn(
        'transition-colors',
        !isDisabled && !isContestClosed && 'cursor-pointer hover:bg-accent/50',
        isClosed && !contestFinished && !isContestClosed && 'opacity-60',
        isDisabled && 'opacity-50 pointer-events-none',
        isContestClosed && 'opacity-60',
      )}
      onClick={handleClick}
    >
      <CardContent className="py-4 px-4 space-y-2">
        {/* Top row: icon + name, status badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <TypeIcon className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold truncate">{category.name}</span>
          </div>
          <div className="shrink-0">
            {isDisabled ? (
              <Badge variant="secondary" className="text-xs">No submission</Badge>
            ) : isContestClosed ? (
              <Badge variant="secondary" className="text-xs">
                <Ban className="h-3 w-3 mr-1" />
                Contest is Closed
              </Badge>
            ) : isClosed && !contestFinished ? (
              <Badge variant="secondary" className="text-xs">
                <Ban className="h-3 w-3 mr-1" />
                Closed
              </Badge>
            ) : category.submissionStatus === 'submitted' ? (
              <Badge variant="default" className="bg-green-600 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            ) : category.submissionStatus === 'uploaded' ? (
              <Badge variant="default" className="bg-amber-500 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {category.description}
          </p>
        )}

        {/* Bottom row: deadline + chevron */}
        <div className="flex items-center justify-between">
          {contestFinished ? (
            <span className="text-muted-foreground text-sm">Contest ended</span>
          ) : isContestClosed ? (
            <span className="text-muted-foreground text-sm">Submissions closed</span>
          ) : !isClosed ? (
            <DeadlineCountdown deadline={category.deadline} />
          ) : (
            <span className="text-muted-foreground text-sm">Submissions closed</span>
          )}
          {!isContestClosed && (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
