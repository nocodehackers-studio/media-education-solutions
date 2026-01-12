import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Trophy, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts'
import {
  Avatar,
  AvatarFallback,
  Button,
  Separator,
} from '@/components/ui'

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Contests',
    href: '/admin/contests',
    icon: Trophy,
  },
]

interface AdminSidebarProps {
  className?: string
}

/**
 * Admin sidebar navigation component.
 * Shows nav links and user profile with logout.
 */
export function AdminSidebar({ className }: AdminSidebarProps) {
  const { user, signOut } = useAuth()

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <aside
      className={cn(
        'w-64 flex flex-col bg-card border-r sticky top-0 h-screen',
        className
      )}
    >
      {/* Logo/Title */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">MES Admin</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="mt-auto">
        <Separator />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user?.email ? getInitials(user.email) : 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName || user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}
