# Story 2.2: Admin Layout & Dashboard Shell

Status: completed

## Story

As a **Super Admin**,
I want **a consistent admin layout with sidebar navigation**,
So that **I can easily navigate between admin sections**.

## Acceptance Criteria

### AC1: Sidebar Navigation
**Given** I am logged in as admin
**When** I view any admin page
**Then** I see a sidebar with navigation links: Dashboard, Contests
**And** the sidebar is 256px wide on desktop

### AC2: Responsive Sidebar
**Given** I am on mobile (< 768px)
**When** I view any admin page
**Then** the sidebar is hidden behind a hamburger menu
**And** I can toggle it open/closed

### AC3: Dashboard Content
**Given** I am on the dashboard
**When** I view the page
**Then** I see placeholder sections for contest stats
**And** the page title shows "Dashboard"

### AC4: User Profile in Sidebar
**Given** the sidebar shows my profile
**When** I look at the bottom of the sidebar
**Then** I see my email and a logout button

### AC5: Breadcrumb Navigation
**Given** breadcrumbs are enabled
**When** I navigate to a nested page (e.g., Contest > Category)
**Then** I see breadcrumb navigation showing the path

## Tasks / Subtasks

- [x] Task 1: Install Required shadcn/ui Components (AC: 1, 2, 5)
  - [x] 1.1 Install Sheet component: `npx shadcn@latest add sheet`
  - [x] 1.2 Install Separator component: `npx shadcn@latest add separator`
  - [x] 1.3 Install Avatar component: `npx shadcn@latest add avatar`
  - [x] 1.4 Install Breadcrumb component: `npx shadcn@latest add breadcrumb`
  - [x] 1.5 Update `src/components/ui/index.ts` with new exports

- [x] Task 2: Create Admin Layout Component (AC: 1, 4)
  - [x] 2.1 Create `src/features/admin/components/AdminLayout.tsx` with sidebar + main content area
  - [x] 2.2 Create `src/features/admin/components/AdminSidebar.tsx` with nav links
  - [x] 2.3 Create `src/features/admin/components/AdminHeader.tsx` for mobile header with menu trigger
  - [x] 2.4 Style sidebar: 256px fixed width, dark background, sticky positioning
  - [x] 2.5 Add nav items: Dashboard (LayoutDashboard icon), Contests (Trophy icon)
  - [x] 2.6 Add user profile section at bottom with email and logout button

- [x] Task 3: Implement Responsive Sidebar (AC: 2)
  - [x] 3.1 Create `src/features/admin/hooks/useSidebar.ts` for open/close state
  - [x] 3.2 Use Sheet component for mobile sidebar (slides from left)
  - [x] 3.3 Add hamburger menu button in AdminHeader (visible < 768px)
  - [x] 3.4 Hide desktop sidebar on mobile, show Sheet instead
  - [x] 3.5 Close sheet on navigation (route change)

- [x] Task 4: Create Breadcrumb System (AC: 5)
  - [x] 4.1 Create `src/features/admin/components/AdminBreadcrumbs.tsx`
  - [x] 4.2 Create `src/features/admin/hooks/useBreadcrumbs.ts` with route-based breadcrumb logic
  - [x] 4.3 Add breadcrumbs to AdminLayout header area
  - [x] 4.4 Configure breadcrumb items for: Dashboard, Contests, Contest Detail, Category

- [x] Task 5: Update Dashboard Page (AC: 3)
  - [x] 5.1 Replace placeholder `src/pages/admin/DashboardPage.tsx` with proper dashboard content
  - [x] 5.2 Add stat cards: Total Contests, Active Contests, Total Submissions
  - [x] 5.3 Add placeholder "Recent Contests" section
  - [x] 5.4 Add placeholder "Judge Progress" section
  - [x] 5.5 Style with consistent spacing and card layouts

- [x] Task 6: Create Contests Page Placeholder (AC: 1)
  - [x] 6.1 Create `src/pages/admin/ContestsPage.tsx` with placeholder content
  - [x] 6.2 Add empty state: "No contests yet" with "Create Contest" button placeholder

- [x] Task 7: Update Router with Layout (AC: 1-5)
  - [x] 7.1 Update `src/router/index.tsx` to use AdminLayout as parent route
  - [x] 7.2 Configure nested routes under AdminLayout (dashboard, contests)
  - [x] 7.3 Use Outlet for child route rendering
  - [x] 7.4 Add /admin/contests route

- [x] Task 8: Update Feature Index and Exports (AC: 1-5)
  - [x] 8.1 Create `src/features/admin/index.ts` with all exports
  - [x] 8.2 Update `src/pages/index.ts` with new page exports
  - [x] 8.3 Update `src/components/ui/index.ts` with new component exports
  - [x] 8.4 Update `PROJECT_INDEX.md` with new components and routes

- [x] Task 9: Testing and Verification (AC: 1-5)
  - [x] 9.1 Create `src/features/admin/components/AdminSidebar.test.tsx` - nav rendering tests
  - [x] 9.2 Manual test: Sidebar visible on desktop with navigation working
  - [x] 9.3 Manual test: Mobile view shows hamburger menu
  - [x] 9.4 Manual test: Mobile sidebar opens/closes correctly
  - [x] 9.5 Manual test: Breadcrumbs update on navigation
  - [x] 9.6 Run `npm run build`, `npm run lint`, `npm run type-check`

## Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Process Violation: Untracked Files (`src/features/admin/components/AdminSidebar.test.tsx`, `src/features/admin/index.ts`, `src/pages/admin/ContestsPage.tsx`) - RESOLVED: Files are already tracked in git
- [x] [AI-Review][MEDIUM] Process Violation: Undocumented Dependencies/Fixes from Previous Story - RESOLVED: Auth files committed in Story 2-1 (commits 12d2157, 1c0b1b1). Not part of Story 2-2 scope.
- [x] [AI-Review][MEDIUM] Code Redundancy in `src/router/index.tsx`: Redundant `/judge` route - DEFERRED: Judge routes out of scope for Story 2-2. Will be restructured with JudgeLayout in Epic 3 (Story 3-4).
- [x] [AI-Review][LOW] Hardcoded Placeholder Strings in `src/pages/admin/DashboardPage.tsx` - BY DESIGN: AC3 requires "placeholder sections for contest stats". Real data in Story 2.7.
- [x] [AI-Review][LOW] Potential `user?.firstName` Display Inconsistency in `src/features/admin/components/AdminSidebar.tsx` - FIXED: Now uses email prefix as fallback (consistent with original pattern).

## Review Remediation Tasks

- [x] [CRITICAL] Process Violation: False Claims - Missing Files. RESOLVED: All files exist and were committed in Story 2-1 (commit 1c0b1b1). Story 2-2 work was completed alongside Story 2-1 code review fixes.
- [x] [HIGH] Process Violation: Uncommitted Changes. RESOLVED: All changes committed. Only .codex session files remain (auto-generated, not part of project scope).

## Dev Notes

### Previous Story (2-1) Learnings

From Story 2-1 implementation:
- AuthContext/AuthProvider already in place with `useAuth()` hook
- `signOut` method available from useAuth for logout button
- AdminRoute wraps protected content (already configured)
- Placeholder DashboardPage exists at `src/pages/admin/DashboardPage.tsx`
- Router at `src/router/index.tsx` needs restructuring for nested layout routes

### Layout Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                        AdminLayout                                 │
├──────────────────┬────────────────────────────────────────────────┤
│   AdminSidebar   │              Main Content Area                  │
│   (256px fixed)  │                                                 │
│                  │  ┌──────────────────────────────────────────┐  │
│  ┌────────────┐  │  │  AdminHeader (mobile) + Breadcrumbs      │  │
│  │  Logo      │  │  └──────────────────────────────────────────┘  │
│  └────────────┘  │                                                 │
│                  │  ┌──────────────────────────────────────────┐  │
│  ┌────────────┐  │  │                                          │  │
│  │ Dashboard  │  │  │              <Outlet />                  │  │
│  │ Contests   │  │  │         (nested route content)           │  │
│  └────────────┘  │  │                                          │  │
│                  │  └──────────────────────────────────────────┘  │
│                  │                                                 │
│  ┌────────────┐  │                                                 │
│  │ User info  │  │                                                 │
│  │ Logout     │  │                                                 │
│  └────────────┘  │                                                 │
└──────────────────┴────────────────────────────────────────────────┘
```

### Component Structure

```typescript
// AdminLayout.tsx - Main layout wrapper
export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <AdminSidebar className="hidden md:flex" />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header with menu trigger */}
        <AdminHeader className="md:hidden" />

        {/* Breadcrumbs */}
        <div className="border-b px-4 py-2">
          <AdminBreadcrumbs />
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Sidebar Navigation Items

```typescript
const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard, // from lucide-react
  },
  {
    title: 'Contests',
    href: '/admin/contests',
    icon: Trophy, // from lucide-react
  },
];
```

### Mobile Sidebar Pattern

```typescript
// Use Sheet from shadcn/ui for mobile sidebar
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui';

function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[256px] p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
```

### Breadcrumb Configuration

```typescript
// Route-based breadcrumb mapping
const breadcrumbConfig: Record<string, { label: string; parent?: string }> = {
  '/admin/dashboard': { label: 'Dashboard' },
  '/admin/contests': { label: 'Contests' },
  '/admin/contests/:id': { label: 'Contest Details', parent: '/admin/contests' },
  '/admin/contests/:id/categories': { label: 'Categories', parent: '/admin/contests/:id' },
};
```

### Router Restructure

```typescript
// Updated router structure with nested layout
const router = createBrowserRouter([
  // ... auth routes ...

  // Admin routes with layout
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'contests', element: <ContestsPage /> },
      // Future: { path: 'contests/:id', element: <ContestDetailPage /> },
    ],
  },

  // ... other routes ...
]);
```

### Styling Specifications

**Sidebar:**
- Width: 256px (w-64)
- Background: `bg-sidebar` or `bg-card` (match shadcn theme)
- Border-right: `border-r`
- Position: `sticky top-0 h-screen`

**Active Nav Item:**
- Background: `bg-accent`
- Text: `text-accent-foreground`
- Use `NavLink` from react-router-dom with `isActive` check

**User Profile Section:**
- Position: bottom of sidebar (mt-auto)
- Show: Avatar (initials), email, logout button
- Separator above

**Mobile Header:**
- Height: 56px (h-14)
- Contains: hamburger menu, app title
- Border-bottom: `border-b`
- Sticky on scroll

### Dashboard Content (Updated)

Replace the current placeholder with:

```tsx
export function DashboardPage() {
  return (
    <div className="space-y-6">
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

      {/* Recent Contests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No contests yet. Create your first contest!</p>
          {/* Placeholder - real list in Story 2.4 */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### File Structure to Create

```
src/
├── features/
│   └── admin/
│       ├── components/
│       │   ├── AdminLayout.tsx
│       │   ├── AdminSidebar.tsx
│       │   ├── AdminSidebar.test.tsx
│       │   ├── AdminHeader.tsx
│       │   └── AdminBreadcrumbs.tsx
│       ├── hooks/
│       │   ├── useSidebar.ts
│       │   └── useBreadcrumbs.ts
│       └── index.ts
├── pages/
│   └── admin/
│       ├── DashboardPage.tsx    # UPDATE (replace placeholder)
│       └── ContestsPage.tsx     # NEW (placeholder)
└── components/
    └── ui/
        ├── sheet.tsx            # NEW (shadcn install)
        ├── separator.tsx        # NEW (shadcn install)
        ├── avatar.tsx           # NEW (shadcn install)
        ├── breadcrumb.tsx       # NEW (shadcn install)
        └── index.ts             # UPDATE with new exports
```

### Dependencies

Already installed:
- lucide-react (icons)
- react-router-dom (routing, NavLink, Outlet)

Need to install (via shadcn):
- Sheet (mobile sidebar)
- Separator (visual divider)
- Avatar (user profile)
- Breadcrumb (navigation trail)

### Testing Notes

**Unit Tests (AdminSidebar.test.tsx):**
- Renders Dashboard and Contests nav links
- Shows user email in profile section
- Logout button triggers signOut
- Active route has active styling

**Manual Testing Checklist:**
1. Desktop: Sidebar visible at 256px width
2. Desktop: Navigation links work and show active state
3. Desktop: User profile shows email at bottom
4. Desktop: Logout button works
5. Mobile: Sidebar hidden, hamburger menu visible
6. Mobile: Sheet opens on menu click
7. Mobile: Sheet closes on navigation
8. Breadcrumbs: Show correct path on each page

### References

- [Source: architecture/core-architectural-decisions.md#Frontend Architecture]
- [Source: epic-2-super-admin-authentication-contest-management.md#Story 2.2]
- [Source: ux-design/design-system-foundation.md]
- [Source: ux-design/user-journey-flows.md#Flow 4: Admin Dashboard]
- [Source: project-context.md#Feature Architecture]
- [shadcn/ui Sheet: https://ui.shadcn.com/docs/components/sheet]
- [React Router Nested Routes: https://reactrouter.com/en/main/start/tutorial#nested-routes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- Installed shadcn/ui components: Sheet, Separator, Avatar, Breadcrumb
- Created AdminLayout with sidebar + main content area using Outlet for nested routes
- Created AdminSidebar with nav links (Dashboard, Contests), user profile, logout button
- Created AdminHeader for mobile with hamburger menu trigger
- Created useSidebar hook for sidebar state management with auto-close on route change
- Created AdminBreadcrumbs + useBreadcrumbs hook with route-based breadcrumb logic
- Updated DashboardPage with stat cards (Total Contests, Active Contests, Total Submissions) and placeholder sections
- Created ContestsPage placeholder with empty state
- Updated router with nested layout routes under AdminLayout
- Created feature index at src/features/admin/index.ts
- All 9 AdminSidebar tests pass
- Build, lint (0 errors), and type-check all pass

**Review Follow-up Resolution (2026-01-12):**
- Addressed 5 review items (1 HIGH, 2 MEDIUM, 2 LOW)
- Fixed firstName display to use email prefix as fallback
- Confirmed untracked files are properly tracked in git
- Documented that Story 2-1 dependencies are out of scope
- Deferred judge route refactoring to Epic 3

**ALL MANUAL TESTS PASS (2026-01-12):**
- ✓ AC1: Sidebar navigation with Dashboard/Contests links (256px width, active state)
- ✓ AC2: Responsive sidebar - hidden on mobile, hamburger menu, Sheet slides from left, auto-closes on navigation
- ✓ AC3: Dashboard content shows stat cards (Total Contests, Active Contests, Total Submissions) and placeholder sections
- ✓ AC4: User profile in sidebar bottom with avatar, email, logout button (functional)
- ✓ AC5: Breadcrumbs display correctly on Dashboard and Contests pages

### Change Log

| Date | Change | Files |
|------|--------|-------|
| 2026-01-12 | Implemented admin layout, sidebar, breadcrumbs, dashboard updates | See File List |
| 2026-01-12 | Addressed code review follow-ups (5 items resolved) | AdminSidebar.tsx |

### File List

**New Files:**
- src/components/ui/avatar.tsx
- src/components/ui/breadcrumb.tsx
- src/components/ui/separator.tsx
- src/components/ui/sheet.tsx
- src/features/admin/components/AdminBreadcrumbs.tsx
- src/features/admin/components/AdminHeader.tsx
- src/features/admin/components/AdminLayout.tsx
- src/features/admin/components/AdminSidebar.test.tsx
- src/features/admin/components/AdminSidebar.tsx
- src/features/admin/hooks/useBreadcrumbs.ts
- src/features/admin/hooks/useSidebar.ts
- src/features/admin/index.ts
- src/pages/admin/ContestsPage.tsx

**Modified Files:**
- src/components/ui/index.ts
- src/pages/admin/DashboardPage.tsx
- src/pages/index.ts
- src/router/index.tsx
- PROJECT_INDEX.md
- package.json
- package-lock.json
