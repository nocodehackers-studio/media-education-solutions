// Story 6-1: Admin submission filter controls

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { useCategories } from '@/features/categories'
import type { AdminSubmissionFilters as Filters } from '../types/adminSubmission.types'

interface AdminSubmissionFiltersProps {
  contestId: string
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function AdminSubmissionFilters({
  contestId,
  filters,
  onFiltersChange,
}: AdminSubmissionFiltersProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories(contestId)

  const handleChange = (key: keyof Filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.categoryId ?? 'all'}
        onValueChange={(v) => handleChange('categoryId', v)}
      >
        <SelectTrigger className="w-[200px]" aria-label="Filter by category" disabled={categoriesLoading}>
          <SelectValue placeholder={categoriesLoading ? 'Loading...' : 'All Categories'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status ?? 'all'}
        onValueChange={(v) => handleChange('status', v)}
      >
        <SelectTrigger className="w-[180px]" aria-label="Filter by status">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="disqualified">Disqualified</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.mediaType ?? 'all'}
        onValueChange={(v) => handleChange('mediaType', v)}
      >
        <SelectTrigger className="w-[160px]" aria-label="Filter by media type">
          <SelectValue placeholder="All Media" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Media</SelectItem>
          <SelectItem value="video">Video</SelectItem>
          <SelectItem value="photo">Photo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
