import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Badge,
} from '@/components/ui';
import type { Contest, ContestStatus } from '../types/contest.types';

// Status colors per UX spec: ux-consistency-patterns.md
const statusConfig: Record<ContestStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  published: { label: 'Published', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  closed: { label: 'Closed', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  reviewed: { label: 'Reviewed', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  finished: { label: 'Finished', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
};

interface ContestCardProps {
  contest: Contest;
  onClick: (id: string) => void;
}

export function ContestCard({ contest, onClick }: ContestCardProps) {
  const status = statusConfig[contest.status];

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-lg overflow-hidden"
      onClick={() => onClick(contest.id)}
      data-testid="contest-card"
    >
      {contest.coverImageUrl && (
        <div className="h-32 overflow-hidden">
          <img src={contest.coverImageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {contest.logoUrl && (
              <img src={contest.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            )}
            <CardTitle className="line-clamp-1">{contest.name}</CardTitle>
          </div>
          <Badge className={status.className} variant="secondary">
            {status.label}
          </Badge>
        </div>
        {contest.description && (
          <CardDescription className="line-clamp-2">
            {contest.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardFooter>
        <div className="text-sm text-muted-foreground">
          <p>Submissions: 0</p>
          <p>Created: {new Date(contest.createdAt).toLocaleDateString()}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
