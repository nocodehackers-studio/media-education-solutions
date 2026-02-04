// features/participants/index.ts
// Participants feature - Code entry, session management, categories
// Status: Active (Epic 4)

// === Components ===
export { CodeEntryForm } from './components/CodeEntryForm'
export { SessionTimeoutWarning } from './components/SessionTimeoutWarning'
export { DeadlineCountdown } from './components/DeadlineCountdown'
export { ParticipantCategoryCard } from './components/ParticipantCategoryCard'
export { ParticipantFeedbackSection } from './components/ParticipantFeedbackSection'
export type { ParticipantCategory, ParticipantDivision, ContestInfo } from './api/participantsApi'

// === Hooks ===
// useParticipantSession is exported from @/contexts (not here)
export { useParticipantCategories } from './hooks/useParticipantCategories'

// === API ===
export { participantsApi, type ParticipantCategoriesResult } from './api/participantsApi'

// === Types ===
export {
  codeEntrySchema,
  type CodeEntryFormData,
  type ParticipantFeedback,
} from './types/participant.schemas'
