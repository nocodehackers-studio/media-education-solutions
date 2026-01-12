// features/contests/index.ts
// Contests feature - Contest CRUD, status management
// Story: 2-3-create-contest

// === Components ===
export { CreateContestForm } from './components/CreateContestForm';

// === Hooks ===
export { useContests } from './hooks/useContests';
export { useCreateContest } from './hooks/useCreateContest';

// === API ===
export { contestsApi } from './api/contestsApi';

// === Utils ===
export { generateContestCode, generateParticipantCodes } from './utils';

// === Types ===
export type {
  Contest,
  ContestRow,
  ContestStatus,
  Participant,
  ParticipantRow,
  ParticipantStatus,
} from './types/contest.types';
export { createContestSchema } from './types/contest.schemas';
export type { CreateContestInput } from './types/contest.schemas';
