// features/contests/index.ts
// Contests feature - Contest CRUD, status management, participant codes
// Stories: 2-3-create-contest, 2-4-contest-list-status-management, 2-6-participant-code-management

// === Components ===
export { ContestCard } from './components/ContestCard';
export { ContestDetailsTab } from './components/ContestDetailsTab';
export { CreateContestForm } from './components/CreateContestForm';
export { DeleteContestButton } from './components/DeleteContestButton';
export { EditContestForm } from './components/EditContestForm';
export { CodesTab } from './components/CodesTab';
export { CodeListTable } from './components/CodeListTable';
/** @deprecated Use AddCodeDialog instead per Change Proposal 2026-01-21 */
export { GenerateCodesButton } from './components/GenerateCodesButton';
export { ExportCodesButton } from './components/ExportCodesButton';
export { AddCodeDialog } from './components/AddCodeDialog';
export { CategoryApprovalList } from './components/CategoryApprovalList';
export { WinnersSetupForm } from './components/WinnersSetupForm';
export { WinnersPreviewDialog } from './components/WinnersPreviewDialog';
export { AdminWinnersTab } from './components/AdminWinnersTab';

// === Hooks ===
export { useContests } from './hooks/useContests';
export { useContest } from './hooks/useContest';
export { useCreateContest } from './hooks/useCreateContest';
export { useUpdateContest } from './hooks/useUpdateContest';
export { useUpdateContestStatus } from './hooks/useUpdateContestStatus';
export { useDeleteContest } from './hooks/useDeleteContest';
export { useParticipantCodes } from './hooks/useParticipantCodes';
/** @deprecated Use useGenerateSingleCode instead per Change Proposal 2026-01-21 */
export { useGenerateCodes } from './hooks/useGenerateCodes';
export { useGenerateSingleCode } from './hooks/useGenerateSingleCode';
export { useDashboardStats } from './hooks/useDashboardStats';
export { useRecentContests } from './hooks/useRecentContests';
export { useActiveContests } from './hooks/useActiveContests';
export { useApproveCategory, useUnapproveCategory } from './hooks/useApproveCategory';
export { useGenerateWinnersPage } from './hooks/useGenerateWinnersPage';
export { useUpdateWinnersPassword, useRevokeWinnersPage, useReactivateWinnersPage } from './hooks/useWinnersManagement';
export { useCategoryApprovalStatus } from './hooks/useCategoryApprovalStatus';
export { useEffectiveWinners } from './hooks/useEffectiveWinners';
export { useContestDetailStats } from './hooks/useContestDetailStats';

// === API ===
export { contestsApi } from './api/contestsApi';
export { winnersApi } from './api/winnersApi';

// === Utils ===
export {
  generateContestCode,
  generateParticipantCode,
  generateParticipantCodes,
  exportCodesToCSV,
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
