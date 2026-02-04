// Story 4-4: Video upload page for participants
// Integrates VideoUploadForm with session context

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { VideoUploadForm } from '@/features/submissions'
import { useParticipantSession } from '@/contexts'

export function VideoUploadPage() {
  const navigate = useNavigate()
  const { categoryId } = useParams<{ categoryId: string }>()
  const { session } = useParticipantSession()

  // Redirect if no session or missing categoryId
  if (!session || !categoryId) {
    navigate('/enter', { replace: true })
    return null
  }

  const handleUploadComplete = (submissionId: string) => {
    navigate(`/participant/preview/${submissionId}`)
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
          <h1 className="text-2xl font-bold">Upload Video</h1>
          <p className="text-muted-foreground">Submit your video entry</p>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Video</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoUploadForm
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
