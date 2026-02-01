// Story 6-3: Admin category rankings page (AC: #3, #4, #5)
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { AdminCategoryRankings } from '@/features/submissions'

export function AdminCategoryRankingsPage() {
  const { contestId, categoryId } = useParams<{ contestId: string; categoryId: string }>()

  if (!contestId || !categoryId) return null

  return (
    <div className="space-y-6">
      {/* Breadcrumb: Submissions / Rankings (AC #9.3) */}
      <div className="flex items-center gap-2">
        <Link to={`/admin/contests/${contestId}/submissions`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Submissions
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-lg font-semibold">Category Rankings</h1>
      </div>

      <AdminCategoryRankings categoryId={categoryId} contestId={contestId} />
    </div>
  )
}
