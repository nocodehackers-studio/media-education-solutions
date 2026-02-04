// Story 6-1: Admin submissions page
// Lists all submissions for a contest with filters and detail panel

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, CardContent, Skeleton } from '@/components/ui'
import { useContest } from '@/features/contests'
import {
  AdminSubmissionFilters,
  AdminSubmissionsTable,
  AdminSubmissionDetail,
  useAdminSubmissions,
} from '@/features/submissions'
import type {
  AdminSubmission,
  AdminSubmissionFiltersType,
} from '@/features/submissions'

export function AdminSubmissionsPage() {
  const { contestId } = useParams<{ contestId: string }>()
  const [filters, setFilters] = useState<AdminSubmissionFiltersType>({})
  const [selectedSubmission, setSelectedSubmission] = useState<AdminSubmission | null>(null)

  const { data: contest, isLoading: contestLoading } = useContest(contestId!)
  const { data: submissions, isLoading, error } = useAdminSubmissions(contestId!, filters)

  if (contestLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="space-y-6">
        <Link to="/admin/contests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contests
          </Button>
        </Link>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-destructive">Contest not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link to={`/admin/contests/${contestId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {contest.name}
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-lg font-semibold">Submissions</h1>
      </div>

      {/* Filters */}
      <AdminSubmissionFilters
        contestId={contestId!}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-destructive">Failed to load submissions</p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      ) : (
        <AdminSubmissionsTable
          submissions={submissions ?? []}
          onSelectSubmission={setSelectedSubmission}
        />
      )}

      {/* Detail Sheet */}
      <AdminSubmissionDetail
        submission={selectedSubmission}
        open={selectedSubmission !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSubmission(null)
        }}
      />
    </div>
  )
}
