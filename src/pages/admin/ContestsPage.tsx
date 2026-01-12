import { Trophy, Plus } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'

/**
 * Contests page placeholder.
 * Shows empty state until contests are created.
 */
export function ContestsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contests</h1>
          <p className="text-muted-foreground">Manage your contests</p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Create Contest
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No contests yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            Create your first contest to start accepting submissions from participants.
          </p>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Contest
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
