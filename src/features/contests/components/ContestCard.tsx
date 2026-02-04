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
      {/* Cover image or placeholder */}
      <div className="h-32 overflow-hidden">
        {contest.coverImageUrl ? (
          <img src={contest.coverImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      <CardHeader className="pb-4">
        {/* Logo — overlaps cover */}
        <div className="-mt-10 mb-2">
          {contest.logoUrl ? (
            <img
              src={contest.logoUrl}
              alt=""
              className="-ml-0.5 w-12 h-12 rounded-xl border-[3px] border-background bg-background object-cover"
            />
          ) : (
            <div className="-ml-0.5 w-12 h-12 rounded-xl border-[3px] border-background bg-muted flex items-center justify-center">
              <span className="text-lg font-semibold text-muted-foreground">
                {contest.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg truncate">{contest.name}</CardTitle>
          <Badge className={status.className} variant="secondary">
            {status.label}
          </Badge>
        </div>
        <CardDescription className="line-clamp-1">
          {contest.description || '\u00A0'}
        </CardDescription>
      </CardHeader>

      <CardFooter className="flex-col gap-0 px-6 pb-6 pt-2">
        <Separator className="mb-4" />
        <div className="grid grid-cols-3 gap-4 w-full text-center">
          <div>
            <p className="text-lg font-semibold">{totalSubmissions}</p>
            <p className="text-xs text-muted-foreground">Submissions</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{reviewedPercent}%</p>
            <p className="text-xs text-muted-foreground">Reviewed</p>
          </div>
          <div>
            <p className="text-lg font-semibold">
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
