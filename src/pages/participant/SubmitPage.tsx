// Story 4-5: Submit page wrapper that routes to correct upload form based on category type
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { VideoUploadPage } from './VideoUploadPage'
import { PhotoUploadPage } from './PhotoUploadPage'
import { Skeleton } from '@/components/ui'
import { useParticipantSession } from '@/contexts'

export function SubmitPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { session } = useParticipantSession()

  const {
    data: categoryType,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['category-type', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('type')
        .eq('id', categoryId!)
        .single()

      if (error) throw error
      return data.type as 'video' | 'photo'
    },
    enabled: !!categoryId && !!session,
  })

  // Redirect if no session
  useEffect(() => {
    if (!session) {
      navigate('/enter', { replace: true })
    }
  }, [session, navigate])

  if (!session) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !categoryType) {
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

  if (categoryType === 'video') {
    return <VideoUploadPage />
  }

  return <PhotoUploadPage />
}
