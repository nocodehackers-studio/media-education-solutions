// Story 6-7: Participant feedback section shown on submission preview when contest is finished
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ParticipantFeedback } from '../types/participant.schemas'

interface ParticipantFeedbackSectionProps {
  feedback: ParticipantFeedback
}

export function ParticipantFeedbackSection({ feedback }: ParticipantFeedbackSectionProps) {
  const displayRating = Math.round(Math.min(10, Math.max(1, feedback.rating)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-lg font-semibold">{feedback.ratingTierLabel}</p>
          <p className="text-sm text-muted-foreground">
            {displayRating} out of 10
          </p>
        </div>
        <div>
          {feedback.feedback ? (
            <p className="text-sm leading-relaxed">{feedback.feedback}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No feedback provided
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
