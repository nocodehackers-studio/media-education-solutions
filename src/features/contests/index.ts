// features/contests/index.ts
// Contests feature - Contest CRUD, status management, participant codes
// Stories: 2-3-create-contest, 2-4-contest-list-status-management, 2-6-participant-code-management

// === Components ===
export { CascadeStatusDialog } from './components/CascadeStatusDialog';
export type { CascadeStatusDialogProps } from './components/CascadeStatusDialog';
export { ContestCard } from './components/ContestCard';
export { CreateContestForm } from './components/CreateContestForm';
export { DeleteContestButton } from './components/DeleteContestButton';
export { DeletedContestsList } from './components/DeletedContestsList';
export { EditContestForm } from './components/EditContestForm';
export { CodesTab } from './components/CodesTab';
export { CodeListTable } from './components/CodeListTable';
/** @deprecated Use AddCodeDialog instead per Change Proposal 2026-01-21 */
export { GenerateCodesButton } from './components/GenerateCodesButton';
export { AddCodeDialog } from './components/AddCodeDialog';
export { CategoryApprovalList } from './components/CategoryApprovalList';
export { WinnersSetupForm } from './components/WinnersSetupForm';
export { WinnersPreviewDialog } from './components/WinnersPreviewDialog';
export { AdminWinnersTab } from './components/AdminWinnersTab';

// === Hooks ===
export { useCascadeContestStatus } from './hooks/useCascadeContestStatus';
export { useContests } from './hooks/useContests';
export { useContest } from './hooks/useContest';
export { useCreateContest } from './hooks/useCreateContest';
export { useUpdateContest } from './hooks/useUpdateContest';
export { useUpdateContestStatus } from './hooks/useUpdateContestStatus';
export { useDeleteContest } from './hooks/useDeleteContest';
export { useDeletedContests } from './hooks/useDeletedContests';
export { useRestoreContest } from './hooks/useRestoreContest';
export { useParticipantCodes } from './hooks/useParticipantCodes';
/** @deprecated Use useGenerateSingleCode instead per Change Proposal 2026-01-21 */
export { useGenerateCodes } from './hooks/useGenerateCodes';
export { useGenerateSingleCode } from './hooks/useGenerateSingleCode';
export { useUpdateParticipantCode } from './hooks/useUpdateParticipantCode';
export { useDeleteParticipantCode } from './hooks/useDeleteParticipantCode';
export { useDashboardStats } from './hooks/useDashboardStats';
export { useRecentContests } from './hooks/useRecentContests';
export { useActiveContests } from './hooks/useActiveContests';
export { useApproveCategory, useUnapproveCategory } from './hooks/useApproveCategory';
export { useGenerateWinnersPage } from './hooks/useGenerateWinnersPage';
export { useUpdateWinnersPassword, useRevokeWinnersPage, useReactivateWinnersPage } from './hooks/useWinnersManagement';
export { useCategoryApprovalStatus } from './hooks/useCategoryApprovalStatus';
export { useEffectiveWinners } from './hooks/useEffectiveWinners';
export { useContestDetailStats } from './hooks/useContestDetailStats';
export { useUploadCoverImage, useDeleteCoverImage, useUploadLogo, useDeleteLogo } from './hooks/useContestCoverImage';

// === API ===
export { contestsApi } from './api/contestsApi';
export { winnersApi } from './api/winnersApi';

// === Utils ===
export {
  generateContestCode,
  generateParticipantCode,
  generateParticipantCodes,
} from './utils';

// === Types ===
export type {
  Contest,
  ContestRow,
  ContestStatus,
  DashboardStats,
  Participant,
  ParticipantRow,
  ParticipantStatus,
} from './types/contest.types';
export { transformParticipant } from './types/contest.types';
export { createContestSchema, updateContestSchema } from './types/contest.schemas';
export type { CreateContestInput, UpdateContestInput } from './types/contest.schemas';
export type {
  CategoryApprovalStatus,
  EffectiveWinner,
  CategoryWinners,
} from './types/winners.types';
