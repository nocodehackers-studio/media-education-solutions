// Story 6-1/6-2: Admin submissions table with full participant data + rating/ranking columns

import { useState, useMemo, type KeyboardEvent } from 'react'
import { ArrowUpDown } from 'lucide-react'
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import type { AdminSubmission } from '../types/adminSubmission.types'
import { SUBMISSION_STATUS_VARIANT, formatSubmissionDate, formatRankingPosition } from '../types/adminSubmission.types'

type SortField = 'submittedAt' | 'rating'
type SortDirection = 'asc' | 'desc'

interface AdminSubmissionsTableProps {
  submissions: AdminSubmission[]
  onSelectSubmission: (submission: AdminSubmission) => void
  contestTimezone?: string
}

export function AdminSubmissionsTable({
  submissions,
  onSelectSubmission,
  contestTimezone,
}: AdminSubmissionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('submittedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedSubmissions = useMemo(() => {
    const sorted = [...submissions]
    sorted.sort((a, b) => {
      if (sortField === 'rating') {
        const aRating = a.review?.rating ?? -1
        const bRating = b.review?.rating ?? -1
        return sortDirection === 'desc' ? bRating - aRating : aRating - bRating
      }
      // Default: submittedAt
      const aTime = new Date(a.submittedAt).getTime()
      const bTime = new Date(b.submittedAt).getTime()
      return sortDirection === 'desc' ? bTime - aTime : aTime - bTime
    })
    return sorted
  }, [submissions, sortField, sortDirection])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  function handleSortKeyDown(field: SortField, e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSort(field)
    }
  }

  function getAriaSortValue(field: SortField): 'ascending' | 'descending' | 'none' {
    if (sortField !== field) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  if (submissions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border py-12 text-muted-foreground">
        No submissions found matching the current filters.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Institution</TableHead>
            <TableHead className="hidden lg:table-cell">TLC</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="hidden sm:table-cell">Media</TableHead>
            <TableHead
              className="hidden md:table-cell cursor-pointer select-none"
              role="columnheader"
              tabIndex={0}
              aria-sort={getAriaSortValue('submittedAt')}
              onClick={() => handleSort('submittedAt')}
              onKeyDown={(e) => handleSortKeyDown('submittedAt', e)}
            >
              <span className="inline-flex items-center gap-1">
                Submitted
                <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead
              className="hidden sm:table-cell cursor-pointer select-none"
              role="columnheader"
              tabIndex={0}
              aria-sort={getAriaSortValue('rating')}
              onClick={() => handleSort('rating')}
              onKeyDown={(e) => handleSortKeyDown('rating', e)}
            >
              <span className="inline-flex items-center gap-1">
                Rating
                <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead className="hidden lg:table-cell">Feedback</TableHead>
            <TableHead className="hidden sm:table-cell">Rank</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSubmissions.map((submission) => (
            <TableRow
              key={submission.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectSubmission(submission)}
            >
              <TableCell className="font-mono text-sm">
                {submission.participantCode}
              </TableCell>
              <TableCell>{submission.studentName ?? '—'}</TableCell>
              <TableCell className="hidden md:table-cell">
                {submission.organizationName ?? '—'}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {submission.tlcName ?? '—'}
              </TableCell>
              <TableCell>{submission.categoryName}</TableCell>
              <TableCell className="hidden sm:table-cell capitalize">
                {submission.mediaType}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatSubmissionDate(submission.submittedAt, 'short', contestTimezone)}
              </TableCell>
              <TableCell>
                <Badge variant={SUBMISSION_STATUS_VARIANT[submission.status] ?? 'secondary'}>
                  {submission.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {submission.review?.rating != null ? `${submission.review.rating}/10` : '—'}
              </TableCell>
              <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                {submission.review?.feedback || '—'}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {submission.rankingPosition != null
                  ? formatRankingPosition(submission.rankingPosition)
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
