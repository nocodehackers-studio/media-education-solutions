// Story 6-1: Admin submissions table with full participant data

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
import { SUBMISSION_STATUS_VARIANT, formatSubmissionDate } from '../types/adminSubmission.types'

interface AdminSubmissionsTableProps {
  submissions: AdminSubmission[]
  onSelectSubmission: (submission: AdminSubmission) => void
}

export function AdminSubmissionsTable({
  submissions,
  onSelectSubmission,
}: AdminSubmissionsTableProps) {
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
            <TableHead className="hidden md:table-cell">Submitted</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow
              key={submission.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectSubmission(submission)}
            >
              <TableCell className="font-mono text-sm">
                {submission.participantCode}
              </TableCell>
              <TableCell>{submission.participantName ?? '—'}</TableCell>
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
                {formatSubmissionDate(submission.submittedAt)}
              </TableCell>
              <TableCell>
                <Badge variant={SUBMISSION_STATUS_VARIANT[submission.status] ?? 'secondary'}>
                  {submission.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
