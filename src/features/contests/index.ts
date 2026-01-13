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
export { GenerateCodesButton } from './components/GenerateCodesButton';
export { ExportCodesButton } from './components/ExportCodesButton';

// === Hooks ===
export { useContests } from './hooks/useContests';
export { useContest } from './hooks/useContest';
export { useCreateContest } from './hooks/useCreateContest';
export { useUpdateContest } from './hooks/useUpdateContest';
export { useUpdateContestStatus } from './hooks/useUpdateContestStatus';
export { useDeleteContest } from './hooks/useDeleteContest';
export { useParticipantCodes } from './hooks/useParticipantCodes';
export { useGenerateCodes } from './hooks/useGenerateCodes';

// === API ===
export { contestsApi } from './api/contestsApi';

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
  Participant,
  ParticipantRow,
  ParticipantStatus,
} from './types/contest.types';
export { transformParticipant } from './types/contest.types';
export { createContestSchema, updateContestSchema } from './types/contest.schemas';
export type { CreateContestInput, UpdateContestInput } from './types/contest.schemas';
