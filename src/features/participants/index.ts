// features/participants/index.ts
// Participants feature - Code entry, session management, info forms, categories
// Status: Active (Epic 4)

// === Components ===
export { CodeEntryForm } from './components/CodeEntryForm'
export { SessionTimeoutWarning } from './components/SessionTimeoutWarning'
export { ParticipantInfoForm } from './components/ParticipantInfoForm'
export { DeadlineCountdown } from './components/DeadlineCountdown'
export { ParticipantCategoryCard, type ParticipantCategory } from './components/ParticipantCategoryCard'

// === Hooks ===
// useParticipantSession is exported from @/contexts (not here)
export { useParticipant } from './hooks/useParticipant'
export { useParticipantCategories } from './hooks/useParticipantCategories'

// === API ===
export { participantsApi, type ParticipantData } from './api/participantsApi'

// === Types ===
export {
  codeEntrySchema,
  type CodeEntryFormData,
  participantInfoSchema,
  type ParticipantInfoFormData,
} from './types/participant.schemas'
// export type { Participant, ParticipantSession } from './types/participant.types';
