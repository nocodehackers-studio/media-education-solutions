import { Trophy, Activity, FileVideo, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

interface StatCardProps {
  title: string
  value: string
  icon: typeof Trophy
}

function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

/**
 * Admin dashboard page showing contest statistics and overview.
 * Displays stat cards, recent contests, and judge progress placeholders.
 */
export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all contests</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Contests" value="—" icon={Trophy} />
        <StatCard title="Active Contests" value="—" icon={Activity} />
        <StatCard title="Total Submissions" value="—" icon={FileVideo} />
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Contests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Contests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No contests yet. Create your first contest!
            </p>
          </CardContent>
        </Card>

        {/* Judge Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Judge Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>No judges assigned yet</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
