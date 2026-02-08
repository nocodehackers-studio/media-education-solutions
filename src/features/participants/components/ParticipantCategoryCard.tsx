import { useNavigate } from 'react-router-dom'
import { Video, Image, CheckCircle, ChevronRight, Lock } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import { DeadlineCountdown } from './DeadlineCountdown'
import { cn, stripHtml } from '@/lib/utils'
import { type ParticipantCategory } from '../api/participantsApi'
import { useParticipantSession } from '@/contexts'

export type { ParticipantCategory } from '../api/participantsApi'

interface ParticipantCategoryCardProps {
  category: ParticipantCategory
  contestEnded?: boolean
  acceptingSubmissions?: boolean
}

export function ParticipantCategoryCard({ category, contestEnded, acceptingSubmissions = true }: ParticipantCategoryCardProps) {
  const navigate = useNavigate()
  const { session } = useParticipantSession()
  const contestTimezone = session?.contestTimezone || 'America/New_York'
  const isClosed = category.status === 'closed'
  const TypeIcon = category.type === 'video' ? Video : Image

  const handleClick = () => {
    navigate(`/participant/category/${category.id}`, {
      state: { category, contestEnded, acceptingSubmissions },
    })
  }

  return (
    <Card
      className={cn(
        'transition-colors transition-opacity duration-150',
        'cursor-pointer hover:bg-accent/50',
        (isClosed || !acceptingSubmissions) && 'opacity-60 hover:opacity-100',
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
            {!acceptingSubmissions && category.submissionStatus === 'submitted' ? (
              <Badge variant="default" className="bg-green-600 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submission received
              </Badge>
            ) : !acceptingSubmissions || isClosed ? (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Submissions closed
              </Badge>
            ) : category.submissionStatus === 'submitted' ? (
              <Badge variant="default" className="bg-green-600 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {stripHtml(category.description)}
          </p>
        )}

        {/* Bottom row: deadline + chevron */}
        <div className="flex items-center justify-between">
          {acceptingSubmissions && !isClosed ? (
            <DeadlineCountdown deadline={category.deadline} timezone={contestTimezone} />
          ) : (
            <span className="text-muted-foreground text-sm">
              {!acceptingSubmissions ? 'Contest ended' : 'Submissions closed'}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}
