// Story 4-3: Category card for participant view
// Handles published/closed states and submission status

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

export function ParticipantCategoryCard({ category, contestFinished }: ParticipantCategoryCardProps) {
  const navigate = useNavigate();
  const isClosed = category.status === 'closed';
  const isDisabled = contestFinished && category.noSubmission;
  const TypeIcon = category.type === 'video' ? Video : Image;

  const handleSubmit = () => {
    navigate(`/participant/submit/${category.id}`);
  };

  const handleViewEdit = () => {
    if (category.submissionId) {
      navigate(`/participant/preview/${category.submissionId}`);
    }
  };

  return (
    <Card className={cn(
      isClosed && !contestFinished && 'opacity-60',
      isDisabled && 'opacity-50 cursor-not-allowed',
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
              {category.name}
            </CardTitle>
            {category.description && (
              <CardDescription>{category.description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Type badge */}
            <Badge variant="outline">
              {category.type === 'video' ? 'Video' : 'Photo'}
            </Badge>
            {/* Submission status badges */}
            {!isDisabled && category.submissionStatus === 'submitted' && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            )}
            {!isDisabled && category.submissionStatus === 'uploaded' && (
              <Badge variant="default" className="bg-amber-500">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
            {isDisabled && (
              <Badge variant="secondary">No submission</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
            <Button variant="outline" disabled>
              No submission
            </Button>
          ) : contestFinished && category.hasSubmitted ? (
            <Button variant="outline" onClick={handleViewEdit}>
              View Feedback
            </Button>
          ) : contestFinished ? (
            <Button variant="outline" disabled>
              No submission
            </Button>
          ) : category.hasSubmitted ? (
            <Button variant="outline" onClick={handleViewEdit}>
              {isClosed ? 'View' : 'View/Edit'}
            </Button>
          ) : isClosed ? (
            <Button variant="outline" disabled>
              Closed
            </Button>
          ) : (
            <Button onClick={handleSubmit}>Submit</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
