import { Outlet } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
} from '@/components/ui'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { AdminBreadcrumbs } from './AdminBreadcrumbs'
import { useSidebar } from '../hooks/useSidebar'

/**
 * Admin layout with sidebar navigation and responsive mobile menu.
 * Uses Sheet component for mobile sidebar.
 */
export function AdminLayout() {
  const { isOpen, setIsOpen, open } = useSidebar()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <AdminSidebar className="hidden md:flex" />

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header with menu trigger */}
        <AdminHeader
          className="md:hidden"
          onMenuClick={open}
        />

        {/* Breadcrumbs */}
        <div className="border-b px-4 py-2">
          <AdminBreadcrumbs />
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 bg-[#F8F8F8]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
