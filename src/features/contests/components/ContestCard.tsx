import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Badge,
  Separator,
} from '@/components/ui';
import { useCategories } from '@/features/categories';
import { useAdminSubmissions } from '@/features/submissions';
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

function computeDaysLeft(categories: { deadline: string }[]): number | null {
  if (categories.length === 0) return null;
  const now = new Date();
  const latest = categories.reduce((acc, cat) => {
    const d = new Date(cat.deadline);
    return d > acc ? d : acc;
  }, new Date(0));
  if (latest <= now) return 0;
  return Math.ceil((latest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ContestCard({ contest, onClick }: ContestCardProps) {
  const status = statusConfig[contest.status];

  const { data: categories } = useCategories(contest.id);
  const { data: submissions } = useAdminSubmissions(contest.id);

  const totalSubmissions = submissions?.length ?? 0;
  const categoryCount = categories?.length ?? 0;
  const categoriesJudged = categories?.filter((c) => c.judgingCompletedAt !== null).length ?? 0;
  const reviewedPercent = categoryCount > 0 ? Math.round((categoriesJudged / categoryCount) * 100) : 0;
  const daysLeft = categories ? computeDaysLeft(categories) : null;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-lg overflow-hidden"
      onClick={() => onClick(contest.id)}
      data-testid="contest-card"
    >
      {/* Cover image with overlapping logo */}
      {contest.coverImageUrl && (
        <div className="h-32 overflow-hidden">
          <img src={contest.coverImageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <CardHeader className={contest.coverImageUrl && contest.logoUrl ? 'pb-3' : undefined}>
        {/* Logo — overlaps cover when present */}
        {contest.logoUrl && (
          <div className={contest.coverImageUrl ? '-mt-10 mb-1' : ''}>
            <img
              src={contest.logoUrl}
              alt=""
              className="-ml-0.5 w-12 h-12 rounded-xl border-[3px] border-background bg-background object-cover"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <CardTitle className="line-clamp-1">{contest.name}</CardTitle>
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

      <CardFooter className="flex-col gap-0 px-6 pb-4 pt-0">
        <Separator className="mb-4" />
        <div className="grid grid-cols-3 gap-4 w-full text-center">
          <div>
            <p className="text-2xl font-bold">{totalSubmissions}</p>
            <p className="text-xs text-muted-foreground">Submissions</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{reviewedPercent}%</p>
            <p className="text-xs text-muted-foreground">Reviewed</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {daysLeft === null ? '—' : daysLeft}
            </p>
            <p className="text-xs text-muted-foreground">
              {daysLeft === 0 ? 'Ended' : 'Days Left'}
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
