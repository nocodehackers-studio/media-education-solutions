import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface AdminHeaderProps {
  className?: string
  onMenuClick: () => void
}

/**
 * Mobile header with hamburger menu trigger.
 * Visible only on mobile (< 768px).
 */
export function AdminHeader({ className, onMenuClick }: AdminHeaderProps) {
  return (
    <header
      className={cn(
        'h-14 border-b bg-card flex items-center px-4 sticky top-0 z-40',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="ml-3 text-lg font-semibold">MES Admin</h1>
    </header>
  )
}
