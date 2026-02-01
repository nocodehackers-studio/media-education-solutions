// TanStack Query hooks for contests feature
export { useContests } from './useContests';
export { useContest } from './useContest';
export { useCreateContest } from './useCreateContest';
export { useUpdateContest } from './useUpdateContest';
export { useUpdateContestStatus } from './useUpdateContestStatus';
export { useDeleteContest } from './useDeleteContest';
export { useParticipantCodes } from './useParticipantCodes';
/** @deprecated Use useGenerateSingleCode instead per Change Proposal 2026-01-21 */
export { useGenerateCodes } from './useGenerateCodes';
export { useGenerateSingleCode } from './useGenerateSingleCode';
export { useDashboardStats } from './useDashboardStats';
export { useRecentContests } from './useRecentContests';
export { useActiveContests } from './useActiveContests';
export { useApproveCategory, useUnapproveCategory } from './useApproveCategory';
export { useGenerateWinnersPage } from './useGenerateWinnersPage';
export { useUpdateWinnersPassword, useRevokeWinnersPage, useReactivateWinnersPage } from './useWinnersManagement';
export { useCategoryApprovalStatus } from './useCategoryApprovalStatus';
export { useEffectiveWinners } from './useEffectiveWinners';
