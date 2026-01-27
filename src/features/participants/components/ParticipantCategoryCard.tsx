// Story 4-3: Category card for participant view
// Handles published/closed states and submission status

import { useNavigate } from 'react-router-dom';
import { Video, Image, CheckCircle } from 'lucide-react';
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
}

export function ParticipantCategoryCard({ category }: ParticipantCategoryCardProps) {
  const navigate = useNavigate();
  const isClosed = category.status === 'closed';
  const TypeIcon = category.type === 'video' ? Video : Image;

  const handleSubmit = () => {
    navigate(`/participant/submit/${category.id}`);
  };

  const handleViewEdit = () => {
    navigate(`/participant/submission/${category.id}`);
  };

  return (
    <Card className={cn(isClosed && 'opacity-60')}>
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
            {/* Submitted badge (AC5) */}
            {category.hasSubmitted && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* Deadline countdown */}
          {!isClosed ? (
            <DeadlineCountdown deadline={category.deadline} />
          ) : (
            <span className="text-muted-foreground text-sm">Submissions closed</span>
          )}

          {/* Action button */}
          {category.hasSubmitted ? (
            // AC5: Already submitted - can view even if closed (but not edit)
            <Button variant="outline" onClick={handleViewEdit}>
              {isClosed ? 'View' : 'View/Edit'}
            </Button>
          ) : isClosed ? (
            // AC4: Closed category, no submission
            <Button variant="outline" disabled>
              Closed
            </Button>
          ) : (
            // AC2: Published, not submitted
            <Button onClick={handleSubmit}>Submit</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
