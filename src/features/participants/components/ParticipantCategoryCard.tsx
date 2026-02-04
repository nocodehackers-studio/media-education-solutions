// Story 4-3: Category card for participant view
// Handles published/closed states and submission status
// WS7: Visual improvements — left border accent, improved spacing

import { useNavigate } from 'react-router-dom';
import { Video, Image, CheckCircle, Clock } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { DeadlineCountdown } from './DeadlineCountdown';
import { cn } from '@/lib/utils';
import { type ParticipantCategory } from '../api/participantsApi';

// F2: Re-export type for convenience (single source in api)
export type { ParticipantCategory } from '../api/participantsApi';

interface ParticipantCategoryCardProps {
  category: ParticipantCategory;
  contestFinished?: boolean;
}

function getStatusBorderClass(category: ParticipantCategory, contestFinished?: boolean): string {
  if (contestFinished && category.noSubmission) return 'border-l-4 border-l-muted';
  if (category.submissionStatus === 'submitted') return 'border-l-4 border-l-green-500';
  if (category.submissionStatus === 'uploaded') return 'border-l-4 border-l-amber-500';
  return 'border-l-4 border-l-muted';
}

export function ParticipantCategoryCard({ category, contestFinished }: ParticipantCategoryCardProps) {
  const navigate = useNavigate();
  const isClosed = category.status === 'closed';
  const isDisabled = contestFinished && category.noSubmission;
  const TypeIcon = category.type === 'video' ? Video : Image;

  const handleSubmit = () => {
    navigate(`/participant/submit/${category.id}`, {
      state: { type: category.type },
    });
  };

  const handleViewEdit = () => {
    if (category.submissionId) {
      navigate(`/participant/preview/${category.submissionId}`);
    }
  };

  return (
    <Card className={cn(
      getStatusBorderClass(category, contestFinished),
      isClosed && !contestFinished && 'opacity-60',
      isDisabled && 'opacity-50 cursor-not-allowed',
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <TypeIcon className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{category.name}</span>
            </CardTitle>
            {category.description && (
              <CardDescription className="line-clamp-2">{category.description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className="text-xs">
              {category.type === 'video' ? 'Video' : 'Photo'}
            </Badge>
            {!isDisabled && category.submissionStatus === 'submitted' && (
              <Badge variant="default" className="bg-green-600 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            )}
            {!isDisabled && category.submissionStatus === 'uploaded' && (
              <Badge variant="default" className="bg-amber-500 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
            {isDisabled && (
              <Badge variant="secondary" className="text-xs">No submission</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          {/* Deadline countdown or status text */}
          {contestFinished ? (
            <span className="text-muted-foreground text-sm">Contest ended</span>
          ) : !isClosed ? (
            <DeadlineCountdown deadline={category.deadline} />
          ) : (
            <span className="text-muted-foreground text-sm">Submissions closed</span>
          )}

          {/* Action button */}
          {isDisabled ? (
            <Button variant="outline" size="sm" disabled>
              No submission
            </Button>
          ) : contestFinished && category.hasSubmitted ? (
            <Button variant="outline" size="sm" onClick={handleViewEdit}>
              View Feedback
            </Button>
          ) : contestFinished ? (
            <Button variant="outline" size="sm" disabled>
              No submission
            </Button>
          ) : category.hasSubmitted ? (
            <Button variant="outline" size="sm" onClick={handleViewEdit}>
              {isClosed ? 'View' : 'View/Edit'}
            </Button>
          ) : isClosed ? (
            <Button variant="outline" size="sm" disabled>
              Closed
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit}>Submit</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
