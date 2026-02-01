// Story 6-5: Admin winners tab — compose approval list + setup form + preview
// F9 fix: consistent feature-index imports (no relative sibling imports)
// F7 fix: single data fetch passed down to children

import { useState, useMemo } from 'react';
import {
  useCategoryApprovalStatus,
  CategoryApprovalList,
  WinnersSetupForm,
  WinnersPreviewDialog,
} from '@/features/contests';
import type { Contest } from '@/features/contests';

interface AdminWinnersTabProps {
  contest: Contest;
}

export function AdminWinnersTab({ contest }: AdminWinnersTabProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: categories, isLoading } = useCategoryApprovalStatus(contest.id);

  const { allCategoriesApproved, approvedCount, totalCount } = useMemo(() => {
    if (!categories || categories.length === 0)
      return { allCategoriesApproved: false, approvedCount: 0, totalCount: 0 };
    const approved = categories.filter((c) => c.approvedForWinners).length;
    return {
      allCategoriesApproved: approved === categories.length,
      approvedCount: approved,
      totalCount: categories.length,
    };
  }, [categories]);

  return (
    <div className="space-y-6">
      <CategoryApprovalList
        contestId={contest.id}
        categories={categories}
        isLoading={isLoading}
      />

      <WinnersSetupForm
        contest={contest}
        allCategoriesApproved={allCategoriesApproved}
        approvedCount={approvedCount}
        totalCount={totalCount}
        onPreview={() => setPreviewOpen(true)}
      />

      <WinnersPreviewDialog
        contestId={contest.id}
        contestName={contest.name}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
