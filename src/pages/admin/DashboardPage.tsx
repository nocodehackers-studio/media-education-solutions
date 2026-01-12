import { useAuth } from '@/contexts'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

/**
 * Admin dashboard placeholder page.
 * Full implementation in Story 2.2.
 */
export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.firstName || user?.email}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Shell</CardTitle>
            <CardDescription>
              This is a placeholder. Full dashboard implementation in Story 2.2.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Active Contests</p>
                <p className="text-2xl font-semibold">—</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-semibold">—</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Active Judges</p>
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
