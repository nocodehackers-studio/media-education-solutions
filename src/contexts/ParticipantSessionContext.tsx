import { createContext, useContext } from 'react'

/**
 * Participant session data stored in localStorage.
 * Participants do NOT use Supabase Auth - they use code-based sessions.
 */
export interface ParticipantSession {
  participantId: string
  code: string
  contestId: string
  contestCode: string
  contestName: string
  lastActivity: number // timestamp for inactivity tracking
  // From participant table (if used before):
  name?: string
  organizationName?: string
}

/**
 * Participant session context type.
 */
export interface ParticipantSessionContextType {
  session: ParticipantSession | null
  isLoading: boolean
  isAuthenticated: boolean
  showWarning: boolean
  enterContest: (contestCode: string, participantCode: string) => Promise<void>
  endSession: () => void
  updateActivity: () => void
  extendSession: () => void
}

/**
 * Participant session context for managing code-based authentication.
 * Must be used within ParticipantSessionProvider.
 */
export const ParticipantSessionContext =
  createContext<ParticipantSessionContextType | null>(null)

/**
 * Hook to access participant session context.
 * @throws Error if used outside ParticipantSessionProvider
 */
export function useParticipantSession(): ParticipantSessionContextType {
  const context = useContext(ParticipantSessionContext)
  if (!context) {
    throw new Error(
      'useParticipantSession must be used within a ParticipantSessionProvider'
    )
  }
  return context
}
