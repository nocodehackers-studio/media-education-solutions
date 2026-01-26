// === Contexts ===

// Auth Context - Admin/Judge authentication
export { AuthContext, useAuth } from './AuthContext'
export { AuthProvider } from './AuthProvider'

// Participant Session Context - Code-based authentication for participants
export {
  ParticipantSessionContext,
  useParticipantSession,
  type ParticipantSession,
  type ParticipantSessionContextType,
} from './ParticipantSessionContext'
export { ParticipantSessionProvider } from './ParticipantSessionProvider'
