import { useAuth } from '@/contexts'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

/**
 * Judge dashboard placeholder page.
 * Full implementation in Epic 3.
 */
export function JudgeDashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Judge Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome, {user?.firstName || user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Judge Dashboard Shell</CardTitle>
            <CardDescription>
              This is a placeholder. Full implementation in Epic 3.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Assigned Categories</p>
                <p className="text-2xl font-semibold">—</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-semibold">—</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>User ID: {user?.id}</p>
          <p>Role: {user?.role}</p>
        </div>
      </div>
    </div>
  )
}
