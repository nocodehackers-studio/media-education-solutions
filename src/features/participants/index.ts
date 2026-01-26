// features/participants/index.ts
// Participants feature - Code entry, session management, info forms
// Status: Active (Epic 4)

// === Components ===
export { CodeEntryForm } from './components/CodeEntryForm'
export { SessionTimeoutWarning } from './components/SessionTimeoutWarning'
// export { ParticipantInfoForm } from './components/ParticipantInfoForm';

// === Hooks ===
// useParticipantSession is exported from @/contexts (not here)

// === API ===
// export { participantsApi } from './api/participantsApi';

// === Types ===
export {
  codeEntrySchema,
  type CodeEntryFormData,
} from './types/participant.schemas'
// export type { Participant, ParticipantSession } from './types/participant.types';
