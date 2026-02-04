// Story 4-5: Submit page wrapper that routes to correct upload form based on category type
// Fix: Replaced direct Supabase query (blocked by RLS for participants) with
// navigation state + edge function fallback via useParticipantCategories.
import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { VideoUploadPage } from './VideoUploadPage'
import { PhotoUploadPage } from './PhotoUploadPage'
import { Skeleton } from '@/components/ui'
import { useParticipantSession } from '@/contexts'
import { useParticipantCategories } from '@/features/participants'

export function SubmitPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useParticipantSession()

  // Primary: read category type from navigation state (passed by ParticipantCategoryCard)
  const navType = (location.state as { type?: string } | null)?.type as
    | 'video'
    | 'photo'
    | undefined

  console.log('[SubmitPage] Mount', {
    categoryId,
    hasSession: !!session,
    navType: navType ?? 'not in nav state',
  })

  // Fallback: fetch categories via edge function (handles participant auth via service role key).
  // This covers direct URL access / page refresh where navigation state is absent.
  // If navType exists, TanStack Query will still use cached data if available but
  // we won't block rendering on it.
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useParticipantCategories({
    contestId: session?.contestId || '',
    participantId: session?.participantId || '',
    participantCode: session?.code || '',
  })

  // Resolve category type: prefer nav state, fallback to edge function data
  const categoryType = useMemo(() => {
    if (navType) {
      console.log('[SubmitPage] Resolved type from navigation state:', navType)
      return navType
    }
    if (categoriesData?.categories && categoryId) {
      const match = categoriesData.categories.find((c) => c.id === categoryId)
      if (match) {
        console.log('[SubmitPage] Resolved type from edge function data:', match.type)
        return match.type
      }
      console.warn('[SubmitPage] Category not found in edge function data', { categoryId })
    }
    return undefined
  }, [navType, categoriesData, categoryId])

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      console.log('[SubmitPage] No session, redirecting to /enter')
      navigate('/enter', { replace: true })
    }
  }, [session, navigate])

  if (!session) {
    return null
  }

  // Only show loading if we don't have the type yet and the fallback is still fetching
  if (!categoryType && categoriesLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (categoriesError || !categoryType) {
    console.error('[SubmitPage] Failed to resolve category type', {
      categoryId,
      categoriesError: categoriesError?.message ?? null,
      categoryType,
      categoriesCount: categoriesData?.categories?.length ?? 0,
    })
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-destructive">
            Failed to load category. Please try again.
          </p>
        </div>
      </div>
    )
  }

  console.log('[SubmitPage] Rendering upload page', {
    categoryId,
    categoryType,
  })

  if (categoryType === 'video') {
    return <VideoUploadPage />
  }

  return <PhotoUploadPage />
}
