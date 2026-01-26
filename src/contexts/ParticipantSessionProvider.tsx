import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import {
  ParticipantSessionContext,
  type ParticipantSession,
  type ParticipantInfoUpdate,
} from './ParticipantSessionContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const STORAGE_KEY = 'participant_session'
const SESSION_TIMEOUT_MS = 120 * 60 * 1000 // 120 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000 // 5 minutes before expiry

interface ParticipantSessionProviderProps {
  children: ReactNode
}

/**
 * Restore session from localStorage with expiry check.
 * Returns the session if valid, null otherwise.
 */
function getInitialSession(): ParticipantSession | null {
  const savedSession = localStorage.getItem(STORAGE_KEY)
  if (!savedSession) return null

  try {
    const parsed: ParticipantSession = JSON.parse(savedSession)
    const elapsed = Date.now() - parsed.lastActivity

    if (elapsed < SESSION_TIMEOUT_MS) {
      return parsed
    } else {
      // Session expired - clear it
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

/**
 * Provider that manages participant session state via localStorage.
 * Participants do NOT use Supabase Auth - they use code-based sessions.
 * Session expires after 120 minutes of inactivity.
 */
export function ParticipantSessionProvider({
  children,
}: ParticipantSessionProviderProps) {
  // Use lazy initialization to restore session from localStorage synchronously
  const [session, setSession] = useState<ParticipantSession | null>(
    getInitialSession
  )
  // No loading state needed - session is restored synchronously via lazy init
  const isLoading = false
  const [showWarning, setShowWarning] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Persist session to localStorage when it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  }, [session])

  // End session - moved up to avoid hoisting issues
  const endSession = useCallback(() => {
    setSession(null)
    localStorage.removeItem(STORAGE_KEY)
    setShowWarning(false)
  }, [])

  // Session timeout check
  useEffect(() => {
    if (!session) return

    const checkTimeout = () => {
      const elapsed = Date.now() - session.lastActivity
      const remaining = SESSION_TIMEOUT_MS - elapsed

      if (remaining <= 0) {
        // Session expired - set flag before clearing session
        setSessionExpired(true)
        endSession()
        return
      }

      if (remaining <= WARNING_BEFORE_MS && !showWarning) {
        setShowWarning(true)
      }
    }

    // Check every 30 seconds
    const interval = setInterval(checkTimeout, 30_000)
    checkTimeout() // Initial check

    return () => clearInterval(interval)
  }, [session, showWarning, endSession])

  // Enter contest with codes
  const enterContest = useCallback(
    async (contestCode: string, participantCode: string) => {
      const { data, error } = await supabase.functions.invoke(
        'validate-participant',
        {
          body: { contestCode, participantCode },
        }
      )

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Validation failed')
      }

      const newSession: ParticipantSession = {
        participantId: data.participantId,
        code: participantCode.toUpperCase(),
        contestId: data.contestId,
        contestCode: contestCode.toUpperCase(),
        contestName: data.contestName,
        lastActivity: Date.now(),
        name: data.participantData?.name || undefined,
        organizationName: data.participantData?.organizationName || undefined,
      }

      setSession(newSession)
      setShowWarning(false)
    },
    []
  )

  // Update activity timestamp (uses functional update to avoid stale closure)
  const updateActivity = useCallback(() => {
    setSession((prev) => {
      if (!prev) return null
      return { ...prev, lastActivity: Date.now() }
    })
    setShowWarning(false)
  }, [])

  // Extend session (from warning modal)
  const extendSession = useCallback(() => {
    updateActivity()
    toast.success('Session extended')
  }, [updateActivity])

  // Clear expired flag (after redirect handles it)
  const clearExpired = useCallback(() => {
    setSessionExpired(false)
  }, [])

  // Update participant info in session (after form submission)
  const updateParticipantInfo = useCallback((info: ParticipantInfoUpdate) => {
    setSession((prev) => {
      if (!prev) return null
      return {
        ...prev,
        name: info.name,
        organizationName: info.organizationName,
        tlcName: info.tlcName,
        tlcEmail: info.tlcEmail,
        lastActivity: Date.now(),
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: !!session,
      showWarning,
      sessionExpired,
      enterContest,
      endSession,
      updateActivity,
      extendSession,
      clearExpired,
      updateParticipantInfo,
    }),
    [
      session,
      isLoading,
      showWarning,
      sessionExpired,
      enterContest,
      endSession,
      updateActivity,
      extendSession,
      clearExpired,
      updateParticipantInfo,
    ]
  )

  return (
    <ParticipantSessionContext.Provider value={value}>
      {children}
    </ParticipantSessionContext.Provider>
  )
}
