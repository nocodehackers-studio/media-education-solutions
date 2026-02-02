---
title: 'UX Polish — Notifications + Loading Performance'
slug: 'ux-notifications-loading-perf'
created: '2026-02-02'
status: 'completed'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack:
  - React 19.2.3 + TypeScript (strict)
  - Vite 7.3.1
  - Sonner v2.0.7 (toast notifications)
  - Supabase JS (Auth + PostgreSQL, persistSession: true by default)
  - TanStack React Query v5.90.16 (server state)
  - React Router DOM v7.12.0 (lazy routes, Suspense)
  - Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
files_to_modify:
  - src/App.tsx
  - src/components/ui/sonner.tsx
  - src/contexts/AuthProvider.tsx
  - src/contexts/AuthContext.tsx
  - src/router/AdminRoute.tsx
  - src/router/JudgeRoute.tsx
  - src/router/index.tsx
  - src/pages/auth/LoginPage.tsx
  - src/features/contests/api/contestsApi.ts
  - src/features/contests/hooks/useDashboardStats.ts
  - src/features/contests/hooks/useContests.ts
  - src/features/contests/hooks/useActiveContests.ts
  - src/lib/queryClient.ts
  - src/contexts/AuthProvider.test.tsx
  - src/router/AdminRoute.test.tsx
  - src/lib/queryClient.test.ts
code_patterns:
  - Sonner toast wrapper with enforced duration rules (sonner.tsx)
  - AuthProvider with Supabase onAuthStateChange listener + refs for sync access
  - ParticipantSessionProvider localStorage-first pattern (model to follow)
  - Route guards (AdminRoute/JudgeRoute) with safety-net timeouts
  - React.lazy + Suspense for route code-splitting with LazyFallback
  - TanStack Query hooks with global staleTime/refetchOnMount config
  - AdminLayout structure: w-64 sidebar (hidden md:flex), breadcrumbs bar, main content area
  - Error codes: ERROR_CODES constants with getErrorMessage() helper
  - Auth API: transformProfile() converts snake_case DB rows to camelCase User type
test_patterns:
  - AuthProvider.test.tsx: mocks supabase.auth + authApi, uses renderHook with wrapper
  - AdminRoute.test.tsx: uses AuthContext.Provider with mock values, asserts on "Loading..." text
  - Tests will need updating: "Loading..." text assertions change to skeleton DOM structure
---

# Tech-Spec: UX Polish — Notifications + Loading Performance

**Created:** 2026-02-02

## Overview

### Problem Statement

The application has two UX issues degrading admin experience:

1. **Notifications** are positioned top-right and auto-dismiss after only 4 seconds. Error toasts persist correctly but there's no way to control the global behavior (10s desired). Position should be bottom-right.

2. **Loading performance** is poor due to a triple-loading pipeline: AuthProvider's 2-second hardcoded timeout → route guard "Loading..." text → Suspense fallback "Loading..." text → page-level skeleton → actual content. On tab return after ~1 minute, the entire admin tree is torn down by auth state churn, causing 15+ second reload times even with an empty database. The `getStats()` API makes 4 sequential network calls instead of parallel.

### Solution

**Part 1 — Notifications:** Reconfigure Sonner position and duration. Error toasts remain persistent (Infinity). All other toasts auto-dismiss at 10 seconds. Sonner's built-in hover-pause handles the "don't dismiss while hovering" requirement natively.

**Part 2 — Auth loading overhaul:** Cache admin profile in localStorage (mirroring the existing `ParticipantSessionProvider` pattern). Restore synchronously on mount so `isLoading` starts as `false`. Validate the Supabase token in the background. Enforce valid tokens on actions (API calls, navigation) — expired tokens trigger redirect to login. Remove the 2-second `SESSION_RESTORE_TIMEOUT`. Replace all "Loading..." text screens with skeleton layouts.

**Part 3 — Query performance:** Parallelize `getStats()` with `Promise.all`. Use `placeholderData` on key query hooks so stale cached data renders instantly while background revalidation happens.

### Scope

**In Scope:**
- Move toasts to bottom-right, set default duration to 10s
- Error toasts stay persistent (duration: Infinity), non-error toasts stack and dismiss independently
- Cache admin profile in localStorage on successful auth
- Synchronous profile restore from localStorage on app load (ParticipantSessionProvider pattern)
- Background token validation — non-blocking UI
- Global auth error handler: catch 401/auth errors on any Supabase API call → redirect to login
- Remove `SESSION_RESTORE_TIMEOUT` (2s) entirely
- Replace "Loading..." text in AdminRoute, JudgeRoute, and LazyFallback with skeleton layouts
- Prevent auth state churn from tearing down admin component tree on tab return
- Parallelize `getStats()` COUNT queries with `Promise.all`
- Add `placeholderData` to key React Query hooks

**Out of Scope:**
- Login form resource loop (browser extension issue, not app code)
- React Query `refetchOnWindowFocus` changes (already disabled globally)
- Supabase realtime subscriptions
- Changes to ParticipantSessionProvider (already well-designed)
- New features or UI beyond loading/notification behavior

## Context for Development

### Codebase Patterns

- **Toast system:** Sonner v2 with custom wrapper at `src/components/ui/sonner.tsx`. The wrapper enforces `duration: Infinity` on error toasts. The `<Toaster>` component is rendered in `App.tsx` with `position="top-right" duration={4000} closeButton`.
- **Auth flow:** `AuthProvider` wraps the entire app. Uses `supabase.auth.getSession()` on mount + `onAuthStateChange` listener. Currently starts with `isLoading=true` and has a 2s timeout as a safety net. The `signIn()` method calls `authApi.signIn()` which does auth + profile fetch, then sets both `sessionUserId` and `user` in state. A `sessionUserIdRef` provides synchronous access to current session ID for event listeners.
- **Auth context shape:** `AuthContextType` exposes `user: User | null`, `isLoading: boolean`, `isAuthenticated: boolean`, `signIn()`, `signOut()`, `resetPassword()`. The `User` type has: `id, email, role ('admin'|'judge'), firstName, lastName`.
- **ParticipantSessionProvider (model to follow):** Uses `getInitialSession()` as a synchronous lazy initializer for `useState`. `isLoading` is hardcoded `false`. No async blocking on mount. Persists to localStorage via `useEffect` on session change. Validates expiry by comparing `lastActivity` timestamp against `SESSION_TIMEOUT_MS`.
- **Route guards:** `AdminRoute` and `JudgeRoute` check `isLoading`, `isAuthenticated`, and `user`. When `isLoading=true`, they show a "Loading..." text screen. They have a 5s `PROFILE_WAIT_TIMEOUT` safety-net that calls `signOut()` if profile never arrives. The `waitingForProfile` state tracks `!isLoading && isAuthenticated && !user`.
- **AdminLayout structure:** `flex min-h-screen bg-background` outer container. `w-64` sidebar (`hidden md:flex`), mobile sidebar via Sheet component, mobile header (`md:hidden`), breadcrumbs bar (`border-b px-4 py-2`), main content area (`flex-1 p-4 md:p-6` with `<Outlet />`).
- **Lazy routes:** All admin/judge pages are `React.lazy()` with `<Suspense fallback={<LazyFallback />}>`. LazyFallback shows centered "Loading..." text with `animate-pulse`. Admin routes are nested: `AdminRoute > LazyRoute(AdminLayout) > [children with individual LazyRoute wrappers]`.
- **React Query:** Global config in `queryClient.ts` sets `staleTime: 30_000`, `refetchOnWindowFocus: false`, `refetchOnMount: false`, `retry: 3`. No `QueryCache` or `MutationCache` error handlers configured. Errors handled per-component.
- **Error handling:** Standardized `ERROR_CODES` in `src/lib/errorCodes.ts` with `getErrorMessage()` helper. Auth-relevant codes: `AUTH_SESSION_EXPIRED`, `AUTH_UNAUTHORIZED`, `SESSION_EXPIRED`. Supabase errors identified by `error.code` (e.g., `PGRST116`, `42P01`, `23505`).
- **Auth API:** `authApi.ts` provides `signIn()` (auth + profile fetch), `signOut()`, `fetchProfile()`, `getSession()`. The `fetchProfile()` returns `User | null` using `transformProfile()` to convert snake_case DB rows.
- **LoginPage:** Shows "Loading..." when `isLoading || isAuthenticated`. Redirects authenticated users via `useEffect` based on `user.role`.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/App.tsx` | Renders `<Toaster>` — change position and duration here |
| `src/components/ui/sonner.tsx` | Custom toast wrapper — error `duration: Infinity` enforced here |
| `src/contexts/AuthProvider.tsx` | Auth state management — add localStorage caching, remove 2s timeout, prevent state churn |
| `src/contexts/AuthContext.tsx` | Auth context type definition — `AuthContextType` interface |
| `src/contexts/ParticipantSessionProvider.tsx` | Reference implementation for localStorage-first auth pattern |
| `src/features/auth/api/authApi.ts` | Auth API layer — `signIn()`, `fetchProfile()`, `transformProfile()` |
| `src/features/auth/types/auth.types.ts` | `User` type definition (id, email, role, firstName, lastName) |
| `src/router/AdminRoute.tsx` | Admin route guard — replace "Loading..." with skeleton, adjust safety-net |
| `src/router/JudgeRoute.tsx` | Judge route guard — same changes as AdminRoute |
| `src/router/index.tsx` | LazyFallback + LazyRoute — replace "Loading..." with skeleton |
| `src/pages/auth/LoginPage.tsx` | Login page — also shows "Loading..." text, needs update |
| `src/features/admin/components/AdminLayout.tsx` | Layout structure reference for skeleton design |
| `src/features/admin/components/AdminSidebar.tsx` | Sidebar uses `useAuth()` for user data — benefits from cached profile |
| `src/features/contests/api/contestsApi.ts` | `getStats()` — parallelize 4 sequential COUNT queries |
| `src/features/contests/hooks/useDashboardStats.ts` | Dashboard stats hook — add placeholderData |
| `src/features/contests/hooks/useContests.ts` | Contests list hook — add placeholderData |
| `src/features/contests/hooks/useActiveContests.ts` | Active contests hook — add placeholderData |
| `src/lib/queryClient.ts` | Global React Query config — add global auth error handler via QueryCache |
| `src/lib/errorCodes.ts` | Standardized error codes — `AUTH_SESSION_EXPIRED`, `AUTH_UNAUTHORIZED` |
| `src/lib/supabase.ts` | Supabase client singleton — `persistSession: true` is default |
| `src/contexts/AuthProvider.test.tsx` | Existing tests — need updating for localStorage + skeleton changes |
| `src/router/AdminRoute.test.tsx` | Existing tests — "Loading..." text assertions change to skeleton |

### Technical Decisions

1. **localStorage for profile caching is safe** — Supabase already stores JWT + refresh tokens in localStorage by default (`persistSession: true`). Adding the profile (name, role, id, email, firstName, lastName) alongside the token does not increase the attack surface. XSS is the threat vector for localStorage, and it already applies to the existing tokens.

2. **Stale-while-revalidate for auth** — Show cached profile immediately, validate token in background. Enforce valid token lazily on actions (Supabase API calls fail with auth errors → global handler catches them → redirect to login). This mirrors how Facebook and modern SPAs handle session expiry — users can view cached content, but acting with an expired token redirects to login.

3. **Global auth error handler via `QueryCache`** — Add a `QueryCache` with `onError` callback in `queryClient.ts` that detects Supabase auth errors (JWT expired, 401, `AUTH_SESSION_EXPIRED`) and triggers `signOut()` + redirect to `/login`. Single point of enforcement — no per-component error checking needed. The `MutationCache` gets the same handler for mutations.

4. **Skeleton over "Loading..." text** — Skeletons provide layout continuity. The user sees the shape of the page they're about to see, reducing perceived load time. The skeleton for admin routes should mirror the `AdminLayout` structure: sidebar placeholder on desktop (`w-64`, `hidden md:flex`), breadcrumbs bar, and content area. This means the user sees the same shape whether loading or loaded.

5. **`Promise.all` for `getStats()`** — The 4 COUNT queries (`contests`, `contests` filtered, `participants`, `submissions`) are independent. Running them in parallel cuts wall-clock time from 4 sequential round-trips to 1 parallel batch.

6. **`placeholderData` on query hooks** — TanStack Query's `placeholderData` allows showing the last successful data while a background refetch happens. Combined with `refetchOnMount: false`, returning to a page with stale data shows the cached result instantly instead of a loading state. This eliminates the skeleton flash on tab return when data exists in cache.

## Implementation Plan

### Tasks

#### Part 1 — Notifications (independent, no blockers)

- [x] **Task 1: Change toast position and default duration**
  - File: `src/App.tsx`
  - Action: Change `<Toaster position="top-right" duration={4000} closeButton />` to `<Toaster position="bottom-right" duration={10000} closeButton />`
  - Notes: Sonner's built-in `pauseWhenPageIsHidden` and hover-pause behavior work by default. No additional config needed. Error toasts still override to `duration: Infinity` via the wrapper in `sonner.tsx`. Non-error toasts stack independently and auto-dismiss on their own timers even when a persistent error toast is displayed.

#### Part 2 — Auth Loading Overhaul (dependency chain: Task 2 → 3 → 4 → 5 → 6)

- [x] **Task 2: Add localStorage profile caching to AuthProvider**
  - File: `src/contexts/AuthProvider.tsx`
  - Action:
    1. Add a `PROFILE_STORAGE_KEY = 'admin_profile_v1'` constant (versioned key so future schema changes can invalidate stale cache)
    2. Add a `getCachedProfile(): { user: User; sessionUserId: string } | null` function (synchronous) that reads from `localStorage`, parses JSON, and returns both the `User` object and the cached `sessionUserId` — or `null`. Wrap in try/catch — return `null` on any parse error.
    3. Add a `cacheProfile(user: User | null, sessionUserId: string | null)` helper that writes `{ user, sessionUserId }` to `localStorage` (or removes the key if `user` is `null`)
    4. Call `getCachedProfile()` once at the top of the component body, store in a local `const cached = getCachedProfile()`. Use this single result to initialize all state:
       - `useState<User | null>(cached?.user ?? null)`
       - `useState<boolean>(!cached)` — `isLoading` starts `false` when cache exists, `true` otherwise
       - `useState<string | null>(cached?.sessionUserId ?? null)` — initialize `sessionUserId` from cache so `isAuthenticated` is `true` immediately
       - Set `sessionUserIdRef.current = cached?.sessionUserId ?? null`
    5. In the mount `useEffect`: remove `SESSION_RESTORE_TIMEOUT` and `sessionTimeoutRef` entirely. Keep `resolveLoading()` for the no-cache/no-session path.
    6. **Critical (F2 fix):** Modify `fetchUserProfile()` behavior for background revalidation: when a cached profile exists and the profile fetch times out (5s `PROFILE_FETCH_TIMEOUT`), do NOT call `signOut()` — instead, keep the cached user visible and log a warning. Only sign out on timeout when there is no cached profile (first-time login). The current timeout → signOut logic is destructive when a cached user is being viewed.
    7. **Critical (F4/F8 fix):** In the mount `useEffect`, if `getSession()` returns NO session and a cached profile exists: call `cacheProfile(null, null)`, clear `sessionUserId`, clear `user`, and call `resolveLoading()`. This ensures stale cache is immediately cleared when there's no valid session, preventing a flash of cached UI before redirect.
    8. When `fetchUserProfile()` succeeds: call `cacheProfile(profile, userId)` after `setUser(profile)`
    9. When `fetchUserProfile()` finds no profile (sign out path): call `cacheProfile(null, null)`
    10. In `signIn()`: call `cacheProfile(profile, profile.id)` after `setUser(profile)`
    11. In `signOut()`: call `cacheProfile(null, null)` alongside the existing state clears
    12. In `onAuthStateChange` `SIGNED_OUT` handler: call `cacheProfile(null, null)`
  - Notes: Caching `sessionUserId` alongside the profile ensures `isAuthenticated` is `true` from the first render when cache exists. This prevents route guards from redirecting and the LoginPage from flashing the login form before `getSession()` resolves. Background `getSession()` + `fetchUserProfile()` still runs to revalidate.

- [x] **Task 3: Add global auth error handler to QueryClient**
  - File: `src/lib/queryClient.ts`
  - Action:
    1. Import `QueryCache` and `MutationCache` from `@tanstack/react-query`
    2. Import `supabase` from `@/lib/supabase`
    3. Create an `isAuthError(error: unknown): boolean` helper that checks for Supabase auth errors:
       - `error` is an object with `message` containing `'JWT expired'`, `'invalid JWT'`, `'refresh_token_not_found'`, or `'not authenticated'` (case-insensitive)
       - `error` is an object with `code` equal to `'PGRST301'` (JWT error) or `status` equal to `401`
       - **Do NOT include `403`** — 403 is authorization (valid session, wrong role), not authentication. Treating 403 as auth error would log out judges accessing admin-only endpoints in an infinite loop.
    4. Create `handleAuthError()` function that:
       - Calls `supabase.auth.signOut().catch(() => {})` to clear Supabase's own auth tokens from localStorage (`sb-*-auth-token` keys). Without this, the app would find stale JWT on reload and loop.
       - Calls `localStorage.removeItem('admin_profile_v1')` to clear cached profile
       - Redirects via `window.location.href = '/login'` (hard navigate to fully reset React tree)
    5. Add `queryCache: new QueryCache({ onError: (error) => { if (isAuthError(error)) handleAuthError() } })` to `new QueryClient()`
    6. Add `mutationCache: new MutationCache({ onError: (error) => { if (isAuthError(error)) handleAuthError() } })` to `new QueryClient()`
    7. **Critical (F5 fix):** Add a custom `retry` function to the global query defaults that short-circuits on auth errors — no point retrying a 401 three times:
       ```typescript
       retry: (failureCount, error) => {
         if (isAuthError(error)) return false
         return failureCount < 3
       }
       ```
       Apply the same pattern to mutations: `retry: (failureCount, error) => { if (isAuthError(error)) return false; return failureCount < 1 }`
  - Notes: This is the single-point-of-enforcement for expired sessions. Auth errors skip retries and trigger immediate redirect. The `supabase.auth.signOut()` call is critical to prevent redirect loops — Supabase stores its own tokens in localStorage independently of our `admin_profile_v1` key.

- [x] **Task 4: Replace "Loading..." text with skeleton in AdminRoute**
  - File: `src/router/AdminRoute.tsx`
  - Action:
    1. Replace the `LoadingScreen` component with an `AdminLoadingSkeleton` that mirrors the `AdminLayout` structure:
       ```tsx
       function AdminLoadingSkeleton() {
         return (
           <div className="flex min-h-screen bg-background">
             {/* Desktop sidebar skeleton */}
             <aside className="hidden md:flex w-64 flex-col bg-card border-r">
               <div className="p-4 border-b">
                 <div className="h-6 w-28 bg-muted animate-pulse rounded" />
               </div>
               <div className="p-4 space-y-2">
                 <div className="h-8 w-full bg-muted animate-pulse rounded" />
                 <div className="h-8 w-full bg-muted animate-pulse rounded" />
               </div>
             </aside>
             {/* Main content skeleton */}
             <div className="flex-1 flex flex-col">
               <div className="border-b px-4 py-2">
                 <div className="h-4 w-32 bg-muted animate-pulse rounded" />
               </div>
               <main className="flex-1 p-4 md:p-6">
                 <div className="space-y-4">
                   <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                   <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                   <div className="grid gap-4 md:grid-cols-3 pt-4">
                     <div className="h-24 bg-muted animate-pulse rounded" />
                     <div className="h-24 bg-muted animate-pulse rounded" />
                     <div className="h-24 bg-muted animate-pulse rounded" />
                   </div>
                 </div>
               </main>
             </div>
           </div>
         )
       }
       ```
    2. Keep the `PROFILE_WAIT_TIMEOUT` (5s) safety-net and `waitingForProfile` logic unchanged — it's a last-resort defense
    3. Replace both `return <LoadingScreen />` calls with `return <AdminLoadingSkeleton />`
    4. With cached profile, the `isLoading` check will usually be `false` on mount, so this skeleton only shows when there's no cached profile (first-ever visit or after cache clear)
  - Notes: CSS-only skeleton (no imports from `@/components/ui`) to keep the initial bundle lean. Uses raw Tailwind `animate-pulse` + `bg-muted` classes. Matches `AdminLayout` dimensions: `w-64` sidebar, `border-b` breadcrumbs, `p-4 md:p-6` content.

- [x] **Task 5: Replace "Loading..." text with skeleton in JudgeRoute**
  - File: `src/router/JudgeRoute.tsx`
  - Action:
    1. Judge routes do NOT use `AdminLayout` — they are flat full-page routes with no shared sidebar or layout wrapper (confirmed in `router/index.tsx` lines 198-248). The skeleton must be a simple centered full-page skeleton, not the admin sidebar layout:
       ```tsx
       function JudgeLoadingSkeleton() {
         return (
           <div className="min-h-screen bg-background p-4 md:p-6" data-testid="judge-loading-skeleton">
             <div className="max-w-4xl mx-auto space-y-4">
               <div className="h-8 w-48 bg-muted animate-pulse rounded" />
               <div className="h-4 w-64 bg-muted animate-pulse rounded" />
               <div className="space-y-3 pt-4">
                 <div className="h-24 w-full bg-muted animate-pulse rounded" />
                 <div className="h-24 w-full bg-muted animate-pulse rounded" />
               </div>
             </div>
           </div>
         )
       }
       ```
    2. Replace both `return <LoadingScreen />` calls with `return <JudgeLoadingSkeleton />`
  - Notes: Keep `PROFILE_WAIT_TIMEOUT` safety-net unchanged. CSS-only, no UI component imports. The skeleton is a simple centered content area matching the judge dashboard page structure.

- [x] **Task 6: Split LazyFallback into two variants for admin vs standalone routes**
  - File: `src/router/index.tsx`
  - Action:
    1. **Critical (F3 fix):** `LazyFallback` is used by BOTH admin routes (inside `AdminLayout` with sidebar) AND standalone routes (login, participant, public pages — no parent layout). A single fallback cannot serve both. Create two components:
       ```tsx
       /** For routes inside AdminLayout — renders in the <Outlet /> content area */
       function AdminLazyFallback() {
         return (
           <div className="flex-1 p-4 md:p-6">
             <div className="space-y-4">
               <div className="h-8 w-48 bg-muted animate-pulse rounded" />
               <div className="h-4 w-64 bg-muted animate-pulse rounded" />
               <div className="h-32 w-full bg-muted animate-pulse rounded mt-4" />
             </div>
           </div>
         )
       }

       /** For standalone full-page routes (auth, participant, public) */
       function PageLazyFallback() {
         return (
           <div className="min-h-screen flex items-center justify-center bg-background">
             <div className="space-y-4 w-full max-w-md p-4">
               <div className="h-8 w-48 mx-auto bg-muted animate-pulse rounded" />
               <div className="h-4 w-64 mx-auto bg-muted animate-pulse rounded" />
               <div className="h-32 w-full bg-muted animate-pulse rounded mt-4" />
             </div>
           </div>
         )
       }
       ```
    2. Create two wrapper components: `AdminLazyRoute` (uses `AdminLazyFallback`) and `PageLazyRoute` (uses `PageLazyFallback`)
    3. Update route definitions: admin child routes use `AdminLazyRoute`, all other routes (`ForgotPasswordPage`, `ResetPasswordPage`, `SetPasswordPage`, `NotFoundPage`, `PublicWinnersPage`, `CodeEntryPage`, all participant routes, judge routes) use `PageLazyRoute`
  - Notes: Without this split, the admin-optimized fallback (no `min-h-screen`, uses `flex-1`) renders as a collapsed invisible sliver on every standalone route. This is the most impactful fix from the adversarial review.

- [x] **Task 7: Update LoginPage loading state**
  - File: `src/pages/auth/LoginPage.tsx`
  - Action:
    1. Replace the "Loading..." text block with a card-shaped skeleton that matches the login card layout:
       ```tsx
       if (isLoading || isAuthenticated) {
         return (
           <div className="min-h-screen flex items-center justify-center bg-background p-4">
             <div className="w-full max-w-md space-y-4">
               <div className="h-8 w-48 mx-auto bg-muted animate-pulse rounded" />
               <div className="h-4 w-64 mx-auto bg-muted animate-pulse rounded" />
               <div className="space-y-3 pt-4">
                 <div className="h-10 w-full bg-muted animate-pulse rounded" />
                 <div className="h-10 w-full bg-muted animate-pulse rounded" />
                 <div className="h-10 w-full bg-muted animate-pulse rounded" />
               </div>
             </div>
           </div>
         )
       }
       ```
    2. With cached profile, this skeleton rarely shows — returning users with a cached profile + valid session redirect instantly via the `useEffect`.
  - Notes: The skeleton mimics the login card shape (title + description + 2 inputs + button) without importing UI components.

#### Part 3 — Query Performance (independent of Part 2)

- [x] **Task 8: Parallelize getStats() queries**
  - File: `src/features/contests/api/contestsApi.ts`
  - Action:
    1. Replace the 4 sequential `await supabase.from(...)` calls in `getStats()` with `Promise.all()`. **Important (F11 fix):** Supabase `.select()` calls never reject — they return `{ data, error, count }` objects. The error is in the response, not a thrown exception. This means `Promise.all` is safe here (it only rejects on thrown errors). Each result must be individually checked for `.error`:
       ```typescript
       const [contestsResult, activeResult, participantsResult, submissionsResult] = await Promise.all([
         supabase.from('contests').select('*', { count: 'exact', head: true }),
         supabase.from('contests').select('*', { count: 'exact', head: true }).eq('status', 'published'),
         supabase.from('participants').select('*', { count: 'exact', head: true }),
         supabase.from('submissions').select('*', { count: 'exact', head: true }),
       ])

       // Check each result for errors individually
       if (contestsResult.error) throw new Error(`Failed to fetch contests count: ${contestsResult.error.message}`)
       if (activeResult.error) throw new Error(`Failed to fetch active contests count: ${activeResult.error.message}`)
       if (participantsResult.error) throw new Error(`Failed to fetch participants count: ${participantsResult.error.message}`)

       // Submissions: gracefully handle missing table (42P01)
       let submissions = 0
       if (submissionsResult.error) {
         const isTableMissing = submissionsResult.error.code === '42P01'
           || submissionsResult.error.message?.includes('relation')
           || submissionsResult.error.message?.includes('does not exist')
         if (!isTableMissing) throw new Error(`Failed to fetch submissions count: ${submissionsResult.error.message}`)
       } else {
         submissions = submissionsResult.count ?? 0
       }

       return {
         totalContests: contestsResult.count ?? 0,
         activeContests: activeResult.count ?? 0,
         totalParticipants: participantsResult.count ?? 0,
         totalSubmissions: submissions,
       }
       ```
  - Notes: Supabase JS client returns errors in the response object, not as thrown exceptions — so `Promise.all` is safe and each result is checked individually. Wall-clock time drops from 4 sequential round-trips to 1 parallel batch.

- [x] **Task 9: Add placeholderData to query hooks**
  - Files: `src/features/contests/hooks/useDashboardStats.ts`, `useContests.ts`, `useActiveContests.ts`
  - Action:
    1. In `useDashboardStats.ts`: Add `placeholderData: (previousData) => previousData` (TanStack Query v5 `keepPreviousData` replacement). This shows the last successful stats while revalidating in background.
    2. In `useContests.ts`: Add `placeholderData: (previousData) => previousData`
    3. In `useActiveContests.ts`: Add `placeholderData: (previousData) => previousData`
  - Notes: With `refetchOnMount: false` (global default), these hooks already serve cached data on mount. Adding `placeholderData` ensures that even when data IS refetched (e.g., after invalidation), the old data stays visible instead of showing a loading state. The `isLoading` flag in components will be `false` when placeholder data exists, so skeletons won't flash. The `isPlaceholderData` flag is available if components need to show a subtle "refreshing" indicator.

#### Part 4 — Test Updates (depends on all above)

- [x] **Task 10: Update AuthProvider tests**
  - File: `src/contexts/AuthProvider.test.tsx`
  - Action:
    1. Add `beforeEach(() => localStorage.clear())` to prevent test bleed
    2. Add test: "restores cached profile from localStorage on mount" — set `admin_profile_v1` in localStorage with `{ user, sessionUserId }`, render provider, assert `user` is populated, `isAuthenticated` is `true`, and `isLoading` is `false` immediately (no `waitFor`)
    3. Add test: "caches profile to localStorage on successful sign-in" — sign in, assert `localStorage.getItem('admin_profile_v1')` contains `{ user, sessionUserId }`
    4. Add test: "clears cached profile on sign-out" — sign in, sign out, assert `localStorage.getItem('admin_profile_v1')` is `null`
    5. Add test: "handles corrupted localStorage gracefully" — set `admin_profile_v1` to invalid JSON, render provider, assert `isLoading` is `true` (falls back to network path)
    6. Add test: "clears cache when session is gone" — set `admin_profile_v1` in localStorage, mock `getSession()` returning no session, render provider, assert cache is cleared and user is redirected
    6. Update existing timeout-related tests to account for removed `SESSION_RESTORE_TIMEOUT`

- [x] **Task 11: Update AdminRoute tests**
  - File: `src/router/AdminRoute.test.tsx`
  - Action:
    1. Replace assertions that look for "Loading..." text with assertions for the skeleton DOM structure (e.g., look for `role="main"` or specific skeleton CSS classes, or use `data-testid="admin-loading-skeleton"` — add a `data-testid` to the skeleton root in Task 4)
    2. Keep existing test scenarios (unauthenticated redirect, judge role redirect, admin access) — only change the loading state assertions
    3. Add test: "shows skeleton when loading" — mock `isLoading: true`, assert skeleton renders

### Acceptance Criteria

#### Notifications

- [ ] **AC-1:** Given a user performs any action that triggers a non-error toast, when the toast appears, then it is positioned at the bottom-right of the screen and auto-dismisses after 10 seconds.
- [ ] **AC-2:** Given a user triggers an error toast, when the toast appears, then it is positioned at the bottom-right, persists indefinitely (does not auto-dismiss), and shows a close button.
- [ ] **AC-3:** Given an error toast is persistent on screen, when the user performs another action triggering a success toast, then the success toast appears stacked with the error toast and auto-dismisses independently after 10 seconds while the error toast remains.
- [ ] **AC-4:** Given a toast is visible, when the user hovers over it with the mouse, then the auto-dismiss timer pauses. When the mouse leaves, the timer resumes.

#### Auth Loading — Cached Profile

- [ ] **AC-5:** Given a user has previously signed in (profile cached in localStorage) and JS chunks are already in browser cache (not first-ever visit), when they refresh the page, then the dashboard renders immediately with cached profile data (sidebar shows user name/email, no "Loading..." screen). On the very first visit after a hard refresh (cold cache), a brief Suspense skeleton may appear while JS chunks download — this is acceptable.
- [ ] **AC-6:** Given a user signs in successfully, when the sign-in completes, then the profile and sessionUserId are saved to `localStorage` under the key `admin_profile_v1` as a JSON-serialized `{ user, sessionUserId }` object.
- [ ] **AC-7:** Given a user signs out, when sign-out completes, then the `admin_profile_v1` key is removed from `localStorage`.
- [ ] **AC-8:** Given the `admin_profile_v1` value in localStorage is corrupted (invalid JSON), when the app loads, then it gracefully falls back to the network-based auth flow (shows skeleton, fetches profile from server) without throwing errors.

#### Auth Loading — Background Validation

- [ ] **AC-9:** Given a cached profile exists but the Supabase session token has expired (and refresh token is also expired), when the user tries to perform any data action (navigate, fetch, mutate), then the global error handler catches the auth error immediately (no retries), calls `supabase.auth.signOut()` to clear Supabase tokens, clears the cached profile, and redirects to `/login`.
- [ ] **AC-10:** Given a cached profile exists and the Supabase session token needs refreshing (JWT expired but refresh token valid), when the app loads, then Supabase auto-refreshes the token transparently and the user sees no interruption.

#### Auth Loading — Skeletons

- [ ] **AC-11:** Given the app is loading auth state (no cached profile, first visit), when `AdminRoute` renders, then the user sees a layout-matching skeleton (sidebar placeholder on desktop, breadcrumbs bar, content area placeholders) instead of a centered "Loading..." text.
- [ ] **AC-12:** Given the app is loading a lazy-loaded route chunk, when the `Suspense` boundary triggers, then the user sees a content-area skeleton (page title + content placeholders) inside the already-visible layout instead of a centered "Loading..." text.
- [ ] **AC-13:** Given the user visits the login page while auth is resolving, when the page renders, then the user sees a card-shaped skeleton matching the login form dimensions instead of a centered "Loading..." text.

#### Auth Loading — Tab Return

- [ ] **AC-14:** Given an admin is on a page (e.g., contests list), when they switch to another browser tab for 1+ minutes and return, then the page content remains visible with cached data (no "Loading..." screen, no skeleton flash, no component tree teardown). If data is stale, it revalidates in the background.

#### Query Performance

- [ ] **AC-15:** Given the admin dashboard loads, when `getStats()` executes, then all 4 COUNT queries run in parallel via `Promise.all` (verifiable in Network tab: 4 simultaneous requests instead of sequential).
- [ ] **AC-16:** Given query data exists in the React Query cache from a previous load, when the user navigates back to that page, then the cached data renders instantly (no loading skeleton) and background revalidation occurs silently.

## Additional Context

### Dependencies

- Sonner v2.0.7 (already installed) — hover-pause is built-in by default, no config needed
- Supabase JS client (already installed) — `persistSession: true` is the default, JWT already in localStorage
- TanStack React Query v5.90.16 (already installed) — supports `placeholderData`, `QueryCache`, `MutationCache`
- No new dependencies required. Zero new packages.

### Testing Strategy

**Automated:**
- Update `AuthProvider.test.tsx`: Add tests for localStorage cache/restore, cache clearing on sign-out, corrupted cache graceful fallback (Task 10)
- Update `AdminRoute.test.tsx`: Replace "Loading..." text assertions with skeleton DOM structure assertions (Task 11)

**Manual Testing Checklist:**
1. **Fresh visit (no cache):** Clear localStorage → load app → verify skeleton shows → login → verify profile cached
2. **Return visit (cached):** Refresh page → verify dashboard renders instantly with user data (no loading flash)
3. **Tab switch:** Navigate to contests page → switch tab for 60s → return → verify no loading flash, data stays visible
4. **Expired session:** Manually delete Supabase auth tokens from localStorage (keep `admin_profile`) → click any action → verify redirect to login
5. **Toast position:** Trigger a success action → verify toast appears bottom-right, dismisses after 10s
6. **Toast stacking:** Trigger an error → then trigger a success → verify success appears and auto-dismisses while error stays
7. **Toast hover:** Trigger a success toast → hover mouse over it → verify timer pauses → move mouse away → verify timer resumes
8. **Dashboard stats speed:** Open Network tab → load dashboard → verify 4 COUNT queries fire simultaneously (not sequentially)

### Notes

- **Reference implementation:** `ParticipantSessionProvider` uses `getInitialSession()` as a synchronous lazy initializer for `useState`. The same pattern applies to `AuthProvider` with a `getCachedProfile()` function.
- **Safety-net timeout (5s) in AdminRoute/JudgeRoute** should be kept as a last-resort defense but will rarely fire once profile is cached locally.
- **Commit `bbbcf74`** fixed infinite loading by skipping redundant `SIGNED_IN` events and clearing auth state synchronously in `signOut`. This spec builds on that foundation.
- **LoginPage** also shows "Loading..." and needs the same skeleton treatment. With cached profile, the login page can redirect instantly for returning users.
- **AdminSidebar** calls `useAuth()` to display user name/email/initials. With cached profile, the sidebar renders with real user data immediately instead of fallback "AD" initials.
- **`refetchOnMount: false` + `placeholderData`** means returning to a page after tab-switch will show cached data instantly. The skeleton only appears on truly first-ever load when no cache exists.
- **Risk: stale role in cache** — If an admin's role is changed server-side to judge (rare), the cached profile shows admin UI briefly before the background revalidation catches it and the global error handler redirects. Acceptable tradeoff given the user base.
- **Hard redirect vs router navigate in global error handler** — Using `window.location.href = '/login'` instead of React Router's `navigate()` because `queryClient` is instantiated outside the React tree. Hard redirect fully resets all React state, which is the correct behavior for an expired session.

### Adversarial Review Fixes Applied

The following findings from adversarial review were addressed in this spec:

| Finding | Fix Location | Resolution |
|---------|-------------|------------|
| F1: Missing `signOut()` in handleAuthError → redirect loop | Task 3 step 4 | Added `supabase.auth.signOut()` call before redirect |
| F2: `PROFILE_FETCH_TIMEOUT` destroys cached profile | Task 2 step 6 | Background revalidation timeout no longer signs out when cache exists |
| F3: `LazyFallback` breaks non-admin routes | Task 6 | Split into `AdminLazyFallback` + `PageLazyFallback` |
| F4+F8: `isAuthenticated`/`user` desync + jarring flash | Task 2 steps 4, 7 | Cache `sessionUserId` alongside profile; clear cache when no session |
| F5: Retry 3x before auth redirect | Task 3 step 7 | Custom `retry` function short-circuits on auth errors |
| F6: JudgeRoute skeleton incomplete | Task 5 | Concrete centered skeleton for judge routes (no sidebar) |
| F7: 403 misclassified as auth error | Task 3 step 3 | Removed 403 from `isAuthError()`, only 401 |
| F10: AC-5 untestable | AC-5 | Reworded to acknowledge initial chunk download |
| F11: `Promise.all` error handling | Task 8 | Supabase returns errors in response, not thrown — `Promise.all` is safe; explicit per-result error checks |
| F12: No localStorage versioning | Task 2 step 1 | Key is `admin_profile_v1` |
