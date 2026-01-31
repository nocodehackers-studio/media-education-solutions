// SubmissionFilter - Story 5.1 (AC5)
// Dropdown filter for submission review status

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SubmissionFilter as SubmissionFilterType } from '../types/review.types';

interface SubmissionFilterProps {
  value: SubmissionFilterType;
  onChange: (value: SubmissionFilterType) => void;
}

export function SubmissionFilter({ value, onChange }: SubmissionFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SubmissionFilterType)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Filter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="reviewed">Reviewed</SelectItem>
      </SelectContent>
    </Select>
  );
}
