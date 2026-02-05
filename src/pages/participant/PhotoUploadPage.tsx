// Story 4-5: Photo upload page for participants
// Integrates PhotoUploadForm with session context

import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { PhotoUploadForm } from '@/features/submissions'
import { useParticipantSession } from '@/contexts'

export function PhotoUploadPage() {
  const navigate = useNavigate()
  const { categoryId } = useParams<{ categoryId: string }>()
  const { session } = useParticipantSession()

  // Redirect if no session or missing categoryId
  if (!session || !categoryId) {
    navigate('/', { replace: true })
    return null
  }

  const queryClient = useQueryClient()

  const handleUploadComplete = async () => {
    toast.success('Your submission has been received!')
    await queryClient.refetchQueries({ queryKey: ['participant-categories'] })
    navigate(`/participant/category/${categoryId}`)
  }

  const handleBack = () => {
    navigate(`/participant/category/${categoryId}`)
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Upload Photo</h1>
          <p className="text-muted-foreground">Submit your photo entry</p>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUploadForm
              contestId={session.contestId}
              categoryId={categoryId}
              participantId={session.participantId}
              participantCode={session.code}
              onUploadComplete={handleUploadComplete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
