---
title: 'Route Swap & Cloudflare Turnstile Bot Protection'
slug: 'route-swap-turnstile-bot-protection'
created: '2026-02-04'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 19', 'TypeScript 5.9', 'Vite 7', 'Supabase JS v2', 'Supabase Edge Functions (Deno)', 'React Router v7', 'React Hook Form + Zod', 'Vitest + RTL', 'Tailwind CSS v4', 'Cloudflare Turnstile']
files_to_modify:
  # Route swap - source files
  - 'src/router/index.tsx'
  - 'src/router/ParticipantRoute.tsx'
  - 'src/pages/participant/CodeEntryPage.tsx'
  - 'src/pages/participant/ParticipantCategoriesPage.tsx'
  - 'src/pages/participant/SubmitPage.tsx'
  - 'src/pages/participant/PhotoUploadPage.tsx'
  - 'src/pages/participant/VideoUploadPage.tsx'
  - 'src/pages/participant/ParticipantInfoPage.tsx'
  - 'src/features/participants/components/ParticipantUserMenu.tsx'
  # Turnstile - new files
  - 'src/components/Turnstile.tsx (NEW)'
  - 'src/types/turnstile.d.ts (NEW)'
  - 'supabase/functions/verify-admin-login/index.ts (NEW)'
  # Turnstile - modified source files
  - 'src/features/auth/api/authApi.ts'
  - 'src/features/auth/components/LoginForm.tsx'
  - 'src/features/auth/types/auth.types.ts'
  - 'src/features/participants/components/CodeEntryForm.tsx'
  - 'src/contexts/AuthProvider.tsx'
  - 'src/contexts/ParticipantSessionProvider.tsx'
  - 'src/contexts/ParticipantSessionContext.tsx'
  - 'src/lib/errorCodes.ts'
  - 'supabase/functions/validate-participant/index.ts'
  - 'index.html'
  - '.env.example'
  # Pages modified by Turnstile integration
  - 'src/pages/auth/LoginPage.tsx'
  # Test files (only those requiring actual changes)
  - 'src/features/auth/components/LoginForm.test.tsx'
  - 'src/features/participants/components/CodeEntryForm.test.tsx'
  - 'src/pages/participant/PhotoUploadPage.test.tsx'
  - 'src/pages/participant/VideoUploadPage.test.tsx'
  - 'src/pages/participant/SubmitPage.test.tsx'
  - 'src/pages/participant/ParticipantCategoriesPage.test.tsx'
  - 'src/pages/participant/ParticipantInfoPage.test.tsx'
code_patterns:
  - 'Edge functions: copy-paste corsHeaders + supabaseAdmin client per function'
  - 'Edge functions: { success: boolean, error?: string } response shape'
  - 'Edge functions: Deno.env.get() for secrets, no VITE_ prefix'
  - 'Forms: React Hook Form + Zod resolver + onBlur validation mode'
  - 'Auth: AuthContext signIn wraps authApi.signIn, sets user + cache'
  - 'Participant: enterContest calls supabase.functions.invoke(validate-participant)'
  - 'Error handling: centralized ERROR_CODES + ERROR_MESSAGES in errorCodes.ts'
  - 'Route guards: Navigate with state={{ from: location }} for redirect-back'
test_patterns:
  - 'Vitest with vi.mock, vi.fn, describe/it/expect'
  - 'React Testing Library: render, screen, waitFor'
  - 'User interaction: userEvent.setup() + user.type/click/tab'
  - 'Mock context providers: wrap components in AuthContext.Provider or BrowserRouter'
  - 'Form validation: focus + tab (blur) to trigger, check error text'
  - 'Navigation: vi.mock react-router-dom, assert mockNavigate calls'
---

# Tech-Spec: Route Swap & Cloudflare Turnstile Bot Protection

**Created:** 2026-02-04

## Overview

### Problem Statement

Participant login is at `/enter` instead of `/` (the natural entry point for participants), while the admin/judge login occupies `/` (which redirects to `/login`). This is backwards -- participants are the primary users and should land on the index page. Additionally, zero bot prevention exists on either login form, leaving both vulnerable to brute-force attacks on participant codes and admin/judge credentials.

### Solution

Swap routes so `/` serves the participant code entry form and `/login` serves the admin/judge login. Add Cloudflare Turnstile (Managed mode) with server-side token verification to both login forms to prevent bot-driven brute-force attacks.

### Scope

**In Scope:**
- Route swap: `/` becomes participant code entry, `/login` remains admin/judge login
- Route guard redirect updates (`ParticipantRoute` -> `/`, `AdminRoute`/`JudgeRoute` -> `/login`)
- Subtle judge redirect link below participant code entry form
- Cloudflare Turnstile widget (Managed mode) on both login forms
- New `verify-admin-login` edge function: Turnstile verification + server-side `signInWithPassword`
- Turnstile verification added to existing `validate-participant` edge function
- `authApi.ts` updated to call edge function instead of direct `signInWithPassword`
- Env vars: `VITE_TURNSTILE_SITE_KEY` (Vercel + .env.local), `TURNSTILE_SECRET_KEY` (Supabase secrets)
- `.env.example` updated with new variables

**Out of Scope:**
- Redirects from old `/enter` path
- Moving password recovery routes (`/forgot-password`, `/reset-password`, `/set-password`)
- Rate limiting beyond Turnstile
- Changes to participant post-login routes (remain at `/participant/*`)

## Context for Development

### Codebase Patterns

**Routing:**
- Routes defined in `src/router/index.tsx` using `createBrowserRouter`
- Critical path pages (LoginPage) are eagerly loaded; all others use `React.lazy()` with `PageLazyRoute`/`AdminLazyRoute` Suspense wrappers
- Route guards (`AdminRoute`, `JudgeRoute`, `ParticipantRoute`, `ProtectedRoute`) check auth state and redirect with `Navigate` + location state
- `/login` is referenced in: route guards, page navigations, `queryClient.ts` hard redirect, `ForgotPasswordForm` Link components -- ALL STAY UNCHANGED
- `/enter` is referenced in: `ParticipantRoute`, 5 participant pages, `ParticipantUserMenu` -- ALL CHANGE TO `/`

**Auth Flow (Admin/Judge) -- CURRENT:**
- `LoginPage` renders `LoginForm`, calls `signIn(email, password)` from `useAuth()`
- `AuthProvider.signIn()` calls `authApi.signIn()` which calls `supabase.auth.signInWithPassword()` directly
- `authApi.signIn()` returns `Promise<User>` after fetching profile from `profiles` table
- On success: `AuthProvider` sets user + caches profile to localStorage (`PROFILE_STORAGE_KEY`)
- `onAuthStateChange` listener has guard: `if (session.user.id === sessionUserIdRef.current) return`

**Auth Flow (Admin/Judge) -- NEW:**
- `LoginForm` renders Turnstile widget, obtains token, passes to `onSubmit` as second arg
- `LoginPage.handleSubmit` calls `signIn(email, password, turnstileToken)`
- `AuthProvider.signIn()` calls `authApi.signIn(email, password, turnstileToken)`
- `authApi.signIn()` calls `supabase.functions.invoke('verify-admin-login', { body })` instead of direct `signInWithPassword`
- `authApi.signIn()` returns `{ user, accessToken, refreshToken }` -- new return type
- `AuthProvider.signIn()` sets `sessionUserIdRef` FIRST (prevents `onAuthStateChange` double-processing), then calls `supabase.auth.setSession()` to establish Supabase session on client
- `onAuthStateChange` SIGNED_IN fires but guard skips it (ref already set)

**Auth Flow (Participant) -- CURRENT:**
- `CodeEntryPage` renders `CodeEntryForm`, calls `enterContest(contestCode, participantCode)` from `useParticipantSession()`
- `ParticipantSessionProvider.enterContest()` calls `supabase.functions.invoke('validate-participant', { body })`

**Auth Flow (Participant) -- NEW:**
- `CodeEntryForm` renders Turnstile widget, obtains token, passes to `onSubmit` as second arg
- `CodeEntryPage.handleSubmit` calls `enterContest(contestCode, participantCode, turnstileToken)`
- `ParticipantSessionProvider.enterContest()` passes `turnstileToken` in the edge function body
- `validate-participant` edge function verifies Turnstile token before processing codes

**Edge Functions:**
- Each function is self-contained with copy-pasted `corsHeaders` and `supabaseAdmin` client creation
- Pattern: `Deno.serve(async (req) => { ... })` with OPTIONS preflight handling
- Response shape: `{ success: boolean, error?: string, ...data }`
- Secrets via `Deno.env.get('KEY_NAME')` -- never `VITE_` prefixed
- Some functions use both `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (e.g., `create-judge`)

**Error Handling:**
- Centralized `ERROR_CODES` + `ERROR_MESSAGES` in `src/lib/errorCodes.ts`
- `authApi.signIn()` maps Supabase error messages to app error codes
- `queryClient.ts` has global auth error handler that hard-redirects to `/login`

**Forms:**
- React Hook Form + Zod resolver, `mode: 'onBlur'`
- `LoginForm` reads `isLoading` from `useAuth()` to disable inputs
- `CodeEntryForm` receives `isLoading` as prop
- Both use `Button` with `Loader2` spinner during loading

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/router/index.tsx` | Route definitions -- swap `/enter` route to `/`, remove `/` redirect |
| `src/router/ParticipantRoute.tsx` | Guard redirects to `/enter` (change to `/`) |
| `src/pages/auth/LoginPage.tsx` | Admin/judge login page -- pass Turnstile token through |
| `src/pages/participant/CodeEntryPage.tsx` | Participant entry page -- pass Turnstile token + add judge link |
| `src/features/auth/components/LoginForm.tsx` | Login form -- add Turnstile widget, pass token via onSubmit |
| `src/features/participants/components/CodeEntryForm.tsx` | Code entry form -- add Turnstile widget, pass token via onSubmit |
| `src/features/auth/api/authApi.ts` | `signIn()` -- replace `signInWithPassword` with edge function call |
| `src/features/auth/types/auth.types.ts` | `AuthContextType.signIn` -- add turnstileToken param |
| `src/contexts/AuthProvider.tsx` | `signIn` -- handle edge function response + `setSession()` |
| `src/contexts/ParticipantSessionProvider.tsx` | `enterContest` -- pass Turnstile token to edge function body |
| `src/contexts/ParticipantSessionContext.tsx` | `enterContest` type -- add turnstileToken param |
| `supabase/functions/validate-participant/index.ts` | Add Turnstile verification before code validation |
| `supabase/functions/verify-admin-login/index.ts` | NEW -- Turnstile verify + server-side signInWithPassword |
| `src/lib/errorCodes.ts` | Add `TURNSTILE_FAILED` error code |
| `src/pages/participant/ParticipantCategoriesPage.tsx` | Logout navigates to `/enter` (change to `/`) |
| `src/pages/participant/SubmitPage.tsx` | No-session redirect to `/enter` (change to `/`) |
| `src/pages/participant/PhotoUploadPage.tsx` | No-session redirect to `/enter` (change to `/`) |
| `src/pages/participant/VideoUploadPage.tsx` | No-session redirect to `/enter` (change to `/`) |
| `src/pages/participant/ParticipantInfoPage.tsx` | No-session redirect to `/enter` (change to `/`) |
| `src/features/participants/components/ParticipantUserMenu.tsx` | Logout navigates to `/enter` (change to `/`) |

### Technical Decisions

- **Cloudflare Turnstile (Managed mode)** chosen over reCAPTCHA for privacy and free tier
- **Server-side Turnstile verification** for both forms (edge functions) -- client-only verification is bypassable by bots
- **New `verify-admin-login` edge function** required because admin/judge auth currently happens client-side via `supabase.auth.signInWithPassword()` -- Turnstile token must be verified before auth proceeds
- **Session establishment order**: `AuthProvider.signIn` sets `sessionUserIdRef` BEFORE calling `supabase.auth.setSession()` to prevent `onAuthStateChange` from double-processing the SIGNED_IN event. This is critical for avoiding redundant profile fetches.
- **`authApi.signIn` return type changes** from `Promise<User>` to `Promise<SignInResult>` (where `SignInResult = { user: User, accessToken: string, refreshToken: string }`). This is an internal API -- only `AuthProvider` calls it.
- **Two Supabase clients in `verify-admin-login`**: anon key for `signInWithPassword` (respects auth rate limiting), service role for profile fetch (bypasses RLS). Matches existing pattern in `create-judge`.
- **Turnstile script loaded via `<script>` tag in `index.html`** -- no npm package. Explicit rendering API (`window.turnstile.render()`) used in a reusable React component.
- **Turnstile token passed as second arg to `onSubmit`** -- keeps Zod schema unchanged (no phantom fields), form types clean. Both `LoginFormProps.onSubmit` and `CodeEntryFormProps.onSubmit` get `(data, turnstileToken)` signature.
- **`AuthContextType.signIn` signature changes** to `(email, password, turnstileToken) => Promise<void>`. Clean propagation from form -> page -> context -> API.
- **`ParticipantSessionContextType.enterContest` signature changes** to `(contestCode, participantCode, turnstileToken) => Promise<void>`.
- **Turnstile error handling**: if token missing at submit time, show "Please complete the verification" inline error (not toast). If server-side verification fails, edge function returns `TURNSTILE_FAILED` error code.
- **Env var convention:** `VITE_TURNSTILE_SITE_KEY` (client, Vercel), `TURNSTILE_SECRET_KEY` (server, Supabase secrets) -- matches existing pattern.
- **Route `/enter` becomes dead** -- no redirect, returns 404 via catch-all. User confirmed no backward compatibility needed.
- **`/login` path unchanged** -- all existing references stay correct.
- **CodeEntryPage becomes eagerly loaded** (now critical path at `/`), replacing the previous lazy loading. LoginPage remains eagerly loaded.

## Implementation Plan

### Tasks

- [x] Task 1: Turnstile infrastructure setup
  - File: `index.html`
  - Action: Add `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` before closing `</head>` tag
  - File: `src/types/turnstile.d.ts` (NEW)
  - Action: Create TypeScript declarations for `window.turnstile` API:
    - `interface TurnstileOptions { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void; 'error-callback'?: () => void; theme?: 'light' | 'dark' | 'auto'; size?: 'normal' | 'compact' }`
    - `interface TurnstileInstance { render: (container: string | HTMLElement, options: TurnstileOptions) => string; reset: (widgetId: string) => void; remove: (widgetId: string) => void; getResponse: (widgetId: string) => string | undefined }`
    - Augment `Window` interface with `turnstile?: TurnstileInstance`
  - File: `src/components/Turnstile.tsx` (NEW)
  - Action: Create reusable Turnstile component:
    - Props: `onVerify: (token: string) => void`, `onExpire?: () => void`, `onError?: () => void`
    - Renders a `<div ref={containerRef}>` as the widget mount point
    - `useEffect` on mount: calls `window.turnstile.render(containerRef.current, { sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY, callback: onVerify, 'expired-callback': onExpire, 'error-callback': onError, theme: 'auto' })`
    - Stores `widgetId` in ref for cleanup
    - `useEffect` cleanup: calls `window.turnstile.remove(widgetId)`
    - Expose `reset()` via `useImperativeHandle` + `forwardRef` so parent forms can reset after submission failure
    - On `expired-callback`: auto-reset the widget via `window.turnstile.reset(widgetId)` so the user gets a fresh token without manual intervention (S3 hardening). Then call `onExpire` callback so the parent can clear its token ref. (F12: the component is the single owner of the auto-reset lifecycle -- parent `onExpire` only clears state, does NOT call `reset()`)
    - Guard: if `window.turnstile` not yet loaded, render nothing (script async loading)
  - File: `src/lib/errorCodes.ts`
  - Action: Add `TURNSTILE_FAILED: 'TURNSTILE_FAILED'` to `ERROR_CODES` and `'Verification failed. Please try again.'` to `ERROR_MESSAGES`
  - File: `.env.example`
  - Action: Add comments and variables:
    ```
    # Cloudflare Turnstile (Bot Protection)
    VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
    # Server-side only (Edge Functions) - never prefix with VITE_
    # TURNSTILE_SECRET_KEY=your-turnstile-secret-key
    ```

- [x] Task 2: Create `verify-admin-login` edge function
  - File: `supabase/functions/verify-admin-login/index.ts` (NEW)
  - Action: Create edge function following existing patterns:
    - Copy-paste `corsHeaders` constant (matches all other edge functions)
    - Define `LoginRequest { email: string; password: string; turnstileToken: string }`
    - Define `LoginResponse { success: boolean; access_token?: string; refresh_token?: string; user?: { id, email, role, first_name, last_name }; error?: string }`
    - CORS OPTIONS handler (standard pattern)
    - Step 1: Parse request body, validate all three fields present (return `MISSING_FIELDS` if not)
    - Step 2: Verify Turnstile token:
      ```typescript
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: Deno.env.get('TURNSTILE_SECRET_KEY') ?? '',
          response: turnstileToken,
        }),
      })
      const turnstileResult = await turnstileRes.json()
      if (!turnstileResult.success) return error('TURNSTILE_FAILED', 400)
      ```
    - Step 3: Sign in with Supabase Auth using **anon key client** (respects auth rate limiting):
      ```typescript
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({ email, password })
      ```
    - Step 4: Map auth errors the same way as current `authApi.signIn()`:
      - `invalid login credentials` / `invalid password` -> `AUTH_INVALID_CREDENTIALS`
      - `email not confirmed` -> `EMAIL_NOT_CONFIRMED`
      - Other -> `SERVER_ERROR`
    - Step 5: Fetch profile using **service role client** (bypasses RLS):
      ```typescript
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const { data: profile } = await supabaseAdmin.from('profiles')
        .select('id, email, role, first_name, last_name')
        .eq('id', authData.user.id).single()
      ```
    - Step 6: If no profile found, return `AUTH_INVALID_CREDENTIALS`
    - Step 7: Return success with session tokens + profile:
      ```typescript
      return Response.json({
        success: true,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: profile,
      }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      ```
    - Wrap entire handler in try/catch (standard pattern): catch -> `SERVER_ERROR`
  - Notes: Logs follow existing convention: `console.log` for success, `console.warn` for validation failures, `console.error` for exceptions

- [x] Task 3: Add Turnstile verification to `validate-participant` edge function
  - File: `supabase/functions/validate-participant/index.ts`
  - Action:
    - Update `ValidationRequest` interface (lines 13-16) to add the new field:
      ```typescript
      interface ValidationRequest {
        contestCode: string
        participantCode: string
        turnstileToken: string
      }
      ```
    - Update destructured body (line 37) to include `turnstileToken`:
      ```typescript
      const { contestCode, participantCode, turnstileToken }: ValidationRequest = await req.json()
      ```
    - After the missing codes check (lines 39-45) and BEFORE code normalization (line 48), add Turnstile verification block:
      ```typescript
      // Verify Turnstile token
      if (!turnstileToken) {
        return new Response(
          JSON.stringify({ success: false, error: 'TURNSTILE_FAILED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: Deno.env.get('TURNSTILE_SECRET_KEY') ?? '',
          response: turnstileToken,
        }),
      })
      const turnstileResult = await turnstileRes.json()
      if (!turnstileResult.success) {
        console.warn('Turnstile verification failed')
        return new Response(
          JSON.stringify({ success: false, error: 'TURNSTILE_FAILED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      ```

- [x] Task 4: Update admin/judge auth flow for server-side login
  - File: `src/features/auth/api/authApi.ts`
  - Action:
    - Add new interface above `signIn`:
      ```typescript
      interface SignInResult {
        user: User
        accessToken: string
        refreshToken: string
      }
      ```
    - Rewrite `signIn` function:
      - Change signature to `async function signIn(email: string, password: string, turnstileToken: string): Promise<SignInResult>`
      - **CRITICAL**: `supabase.functions.invoke` treats HTTP 400 responses as errors, setting `error` and making `data` null. The edge function returns error codes in the response body, so we must parse the error context to extract them.
      - Replace the `supabase.auth.signInWithPassword()` call + profile fetch with:
        ```typescript
        const { data, error } = await supabase.functions.invoke('verify-admin-login', {
          body: { email, password, turnstileToken },
        })

        // supabase.functions.invoke sets error for non-2xx responses.
        // The error.context (a Response object) contains the JSON body with our error code.
        if (error) {
          let errorCode = 'SERVER_ERROR'
          try {
            const errorBody = await (error as { context?: Response }).context?.json()
            if (errorBody?.error) errorCode = errorBody.error
          } catch {
            // JSON parse failed, fall through to SERVER_ERROR
          }
          if (errorCode === 'AUTH_INVALID_CREDENTIALS') {
            throw new Error(getErrorMessage(ERROR_CODES.AUTH_INVALID_CREDENTIALS))
          } else if (errorCode === 'TURNSTILE_FAILED') {
            throw new Error(getErrorMessage(ERROR_CODES.TURNSTILE_FAILED))
          } else if (errorCode === 'EMAIL_NOT_CONFIRMED') {
            throw new Error('Please verify your email address before signing in.')
          } else {
            throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
          }
        }

        return {
          user: transformProfile(data.user),
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        }
        ```
    - Remove the old `supabase.auth.signInWithPassword` import usage (the `supabase` import stays for other functions)
  - File: `src/features/auth/types/auth.types.ts`
  - Action: Update `AuthContextType.signIn` signature:
    - Change from: `signIn: (email: string, password: string) => Promise<void>`
    - Change to: `signIn: (email: string, password: string, turnstileToken: string) => Promise<void>`
  - File: `src/contexts/AuthProvider.tsx`
  - Action: Rewrite `signIn` callback:
    ```typescript
    const signIn = useCallback(async (email: string, password: string, turnstileToken: string) => {
      setIsLoading(true)
      try {
        const { user: profile, accessToken, refreshToken } = await authApi.signIn(email, password, turnstileToken)
        // Set ref BEFORE setSession to prevent onAuthStateChange from double-processing
        setSessionUserId(profile.id)
        sessionUserIdRef.current = profile.id
        setUser(profile)
        cacheProfile(profile, profile.id)
        // Establish Supabase session on client (onAuthStateChange SIGNED_IN will be skipped via guard)
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        // S2 hardening: if setSession fails, rollback state to prevent inconsistent auth
        if (sessionError) {
          console.error('Failed to establish session:', sessionError)
          setUser(null)
          setSessionUserId(null)
          sessionUserIdRef.current = null
          cacheProfile(null, null)
          throw new Error(getErrorMessage(ERROR_CODES.SERVER_ERROR))
        }
      } finally {
        setIsLoading(false)
      }
    }, [])
    ```
    - Add `supabase` import if not already imported (check: it's imported in AuthProvider via `@/lib/supabase`)
    - Add `getErrorMessage` and `ERROR_CODES` imports from `@/lib/errorCodes` (needed for S2 rollback error message)

- [x] Task 5: Integrate Turnstile into admin/judge login form
  - File: `src/features/auth/components/LoginForm.tsx`
  - Action:
    - Import `Turnstile` component from `@/components/Turnstile`
    - Add `useRef` for Turnstile token: `const turnstileTokenRef = useRef<string>('')`
    - Add `useRef` for Turnstile component: `const turnstileRef = useRef<{ reset: () => void }>(null)`
    - Update `LoginFormProps.onSubmit` type to `(data: LoginFormData, turnstileToken: string) => Promise<void>`
    - Add `useState` for Turnstile ready state: `const [turnstileReady, setTurnstileReady] = useState(false)`
    - Add Turnstile callback that also clears root form error (F15: clear "Please complete verification" when token arrives):
      ```tsx
      const handleTurnstileVerify = useCallback((token: string) => {
        turnstileTokenRef.current = token
        setTurnstileReady(true)
        form.clearErrors('root')
      }, [form])
      ```
    - Add Turnstile expire callback (F12: parent only clears token ref; the Turnstile component handles auto-reset internally via S3):
      ```tsx
      const handleTurnstileExpire = useCallback(() => {
        turnstileTokenRef.current = ''
        setTurnstileReady(false)
      }, [])
      ```
    - Update form submit handler to validate token, pass it, and reset on failure (F8):
      ```tsx
      <form onSubmit={form.handleSubmit(async (data) => {
        if (!turnstileTokenRef.current) {
          form.setError('root', { message: 'Please complete the verification' })
          return
        }
        try {
          await onSubmit(data, turnstileTokenRef.current)
        } catch (error) {
          // Token consumed on submission - reset widget for retry
          turnstileRef.current?.reset()
          turnstileTokenRef.current = ''
          setTurnstileReady(false)
          throw error // Re-throw so LoginPage handles the error display
        }
      })} ...>
      ```
    - Add Turnstile widget ABOVE the submit button (F16: user sees verification before trying to submit):
      ```tsx
      <Turnstile ref={turnstileRef} onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} />
      {form.formState.errors.root && (
        <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
      )}
      <Button type="submit" disabled={isLoading} ...>
      ```
    - (F11) The submit button remains enabled regardless of Turnstile ready state -- the form submit handler validates the token and shows an inline error if missing. This avoids a confusing disabled state when the Turnstile script is loading.
  - File: `src/pages/auth/LoginPage.tsx`
  - Action: Update `handleSubmit` to pass token:
    ```typescript
    const handleSubmit = async (data: LoginFormData, turnstileToken: string) => {
      try {
        await signIn(data.email, data.password, turnstileToken)
        toast.success('Welcome back!')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Invalid email or password')
      }
    }
    ```

- [x] Task 6: Integrate Turnstile into participant code entry form
  - File: `src/contexts/ParticipantSessionContext.tsx`
  - Action: Update `enterContest` signature in `ParticipantSessionContextType`:
    - Change from: `enterContest: (contestCode: string, participantCode: string) => Promise<void>`
    - Change to: `enterContest: (contestCode: string, participantCode: string, turnstileToken: string) => Promise<void>`
  - File: `src/contexts/ParticipantSessionProvider.tsx`
  - Action: Update `enterContest` callback:
    - Change signature to: `async (contestCode: string, participantCode: string, turnstileToken: string)`
    - Pass `turnstileToken` in the edge function body:
      ```typescript
      const { data, error } = await supabase.functions.invoke('validate-participant', {
        body: { contestCode, participantCode, turnstileToken },
      })
      ```
  - File: `src/features/participants/components/CodeEntryForm.tsx`
  - Action:
    - Import `Turnstile` from `@/components/Turnstile`
    - Add refs: `turnstileTokenRef`, `turnstileRef` (same pattern as LoginForm)
    - Add state: `turnstileReady` (same pattern as LoginForm)
    - Update `CodeEntryFormProps.onSubmit` to `(data: CodeEntryFormData, turnstileToken: string) => Promise<void>`
    - Add Turnstile callbacks: `handleTurnstileVerify` (sets token, clears root error, sets ready), `handleTurnstileExpire` (clears token ref only -- component auto-resets) -- same pattern as LoginForm (F12, F15)
    - Update form submit handler to validate token, pass it, and reset Turnstile on failure (F8 -- same try/catch/reset pattern as LoginForm)
    - Add `<Turnstile>` widget and root form error display ABOVE the submit button (F16 -- same placement as LoginForm)
  - File: `src/pages/participant/CodeEntryPage.tsx`
  - Action: Update `handleSubmit` to pass token:
    ```typescript
    const handleSubmit = async (data: CodeEntryFormData, turnstileToken: string) => {
      setIsSubmitting(true)
      try {
        await enterContest(data.contestCode, data.participantCode, turnstileToken)
        toast.success('Welcome! Choose a category to submit your work.')
        navigate('/participant/categories', { replace: true })
      } catch (error) {
        // ... existing error handling
      } finally {
        setIsSubmitting(false)
      }
    }
    ```
    - Add subtle judge link below the existing "Your codes were provided..." text:
      ```tsx
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Your codes were provided by your teacher or organization.
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        <Link to="/login" className="hover:text-foreground underline-offset-4 hover:underline">
          Are you a judge? Sign in here
        </Link>
      </p>
      ```
    - Import `Link` from `react-router-dom` (add to existing import)

- [x] Task 7: Route swap
  - File: `src/router/index.tsx`
  - Action (F5: use descriptive anchors instead of line numbers since earlier tasks may shift lines):
    - Change `CodeEntryPage` from lazy to eagerly loaded (it's now the critical path at `/`):
      - Remove the lazy import block: `const CodeEntryPage = lazy(() => import(...))`
      - Add eager import near the other eager imports at the top: `import { CodeEntryPage } from '@/pages/participant/CodeEntryPage'`
    - Remove the `/enter` route block (the one with `path: '/enter'` and `<CodeEntryPage />`)
    - Change the `/` route (the one with comment "Default redirect - send to login" and `<Navigate to="/login" replace />`) to:
      ```tsx
      // Participant entry - primary landing page
      {
        path: '/',
        element: <CodeEntryPage />,
      },
      ```
      Note: No `PageLazyRoute` wrapper needed since CodeEntryPage is now eagerly loaded
  - File: `src/router/ParticipantRoute.tsx`
  - Action: Replace all `/enter` references with `/`:
    - Find the expired session `Navigate` (with `expired: true` state) and change `to="/enter"` to `to="/"`
    - Find the unauthenticated `Navigate` and change `to="/enter"` to `to="/"`
    - Update JSDoc comment: Change "Redirects unauthenticated participants to /enter" to "Redirects unauthenticated participants to /"
  - File: `src/pages/participant/ParticipantCategoriesPage.tsx`
  - Action: Replace all `navigate('/enter', ...)` with `navigate('/', ...)` (search for `'/enter'`)
  - File: `src/pages/participant/SubmitPage.tsx`
  - Action: Replace `navigate('/enter', ...)` with `navigate('/', ...)` (search for `'/enter'`). Update any associated console.log message referencing `/enter`.
  - File: `src/pages/participant/PhotoUploadPage.tsx`
  - Action: Replace `navigate('/enter', ...)` with `navigate('/', ...)` (search for `'/enter'`)
  - File: `src/pages/participant/VideoUploadPage.tsx`
  - Action: Replace `navigate('/enter', ...)` with `navigate('/', ...)` (search for `'/enter'`)
  - File: `src/pages/participant/ParticipantInfoPage.tsx`
  - Action: Replace all `navigate('/enter', ...)` with `navigate('/', ...)` (search for `'/enter'`)
  - File: `src/features/participants/components/ParticipantUserMenu.tsx`
  - Action: Replace `navigate('/enter', ...)` with `navigate('/', ...)` (search for `'/enter'`)
  - File: `src/pages/participant/CodeEntryPage.tsx`
  - Action: Verify the session expired redirect in the `useEffect` that clears state -- it uses `navigate(location.pathname, ...)` dynamically, so no change needed. Confirm it works correctly when `location.pathname` is `/`.

- [x] Task 8: Update test files
  - File: `src/features/auth/components/LoginForm.test.tsx`
  - Action:
    - Mock `window.turnstile` in test setup: `beforeEach(() => { window.turnstile = { render: vi.fn().mockReturnValue('widget-1'), reset: vi.fn(), remove: vi.fn(), getResponse: vi.fn() } })`
    - Mock `import.meta.env.VITE_TURNSTILE_SITE_KEY` to `'test-site-key'`
    - Update `mockOnSubmit` type to accept second arg (turnstileToken)
    - In submission tests: set turnstile token before submit by triggering the render callback
    - Update loading state tests to account for Turnstile widget rendering
  - File: `src/features/participants/components/CodeEntryForm.test.tsx`
  - Action: Same Turnstile mocking pattern as LoginForm tests
  - File: `src/router/ProtectedRoute.test.tsx`
  - Action: No changes needed (references `/login` which stays the same)
  - File: `src/router/AdminRoute.test.tsx`
  - Action: No changes needed (references `/login` which stays the same)
  - File: `src/pages/participant/PhotoUploadPage.test.tsx`
  - Action: Replace `/enter` assertions with `/` (search for `'/enter'`)
  - File: `src/pages/participant/VideoUploadPage.test.tsx`
  - Action: Replace `/enter` assertions with `/` (search for `'/enter'`)
  - File: `src/pages/participant/SubmitPage.test.tsx`
  - Action: Replace `/enter` assertions with `/` (search for `'/enter'`)
  - File: `src/pages/participant/ParticipantCategoriesPage.test.tsx`
  - Action: Replace `/enter` assertions with `/` (search for `'/enter'`)
  - File: `src/pages/participant/ParticipantInfoPage.test.tsx`
  - Action: Replace `/enter` references with `/` (search for `'/enter'`)

### Acceptance Criteria

- [x] AC 1: Given a user visits `/`, when the page loads, then the participant code entry form is displayed (not the admin login)
- [x] AC 2: Given a user visits `/login`, when the page loads, then the admin/judge email+password login form is displayed
- [x] AC 3: Given an unauthenticated participant tries to access `/participant/*`, when redirected, then they land on `/` (not `/enter`)
- [x] AC 4: Given a participant is on the code entry page at `/`, when they look below the form, then they see a subtle link "Are you a judge? Sign in here" that links to `/login`
- [x] AC 5: Given a participant on `/` enters valid codes, when they submit the form, then the Turnstile token is sent to `validate-participant` edge function, verified server-side, and the participant is logged in
- [x] AC 6: Given an admin/judge on `/login` enters valid credentials, when they submit the form, then the Turnstile token is sent to `verify-admin-login` edge function, verified server-side, auth happens server-side, and session tokens are established on the client
- [x] AC 7: Given a bot attempts to submit the participant form without a valid Turnstile token, when the edge function receives the request, then it returns `TURNSTILE_FAILED` error and does not validate codes
- [x] AC 8: Given a bot attempts to submit the admin login form without a valid Turnstile token, when the edge function receives the request, then it returns `TURNSTILE_FAILED` error and does not attempt sign-in
- [x] AC 9: Given a user submits a form but Turnstile has not yet generated a token, when they click submit, then an inline error "Please complete the verification" is shown
- [x] AC 10: Given the Turnstile token expires (after 300s), when the user tries to submit, then the expired token is rejected server-side and the widget resets for a new token
- [x] AC 11: Given a successful admin login via edge function, when `setSession()` is called on the client, then `onAuthStateChange` does not trigger a redundant profile fetch (guard prevents double-processing)
- [x] AC 12: Given an admin enters wrong credentials, when the edge function returns `AUTH_INVALID_CREDENTIALS`, then the user sees "Invalid email or password" (same UX as current behavior)
- [x] AC 13: Given a participant logs out from any participant page, when the logout completes, then they are redirected to `/` (not `/enter`)
- [x] AC 14: Given `VITE_TURNSTILE_SITE_KEY` is not set, when the page loads, then the Turnstile widget does not render (graceful degradation, no crash)
- [x] AC 15: Given all existing tests are run, when the test suite executes, then all tests pass with updated route references and Turnstile mocks

## Additional Context

### Dependencies

- Cloudflare Turnstile account with site key + secret key (already configured)
- `VITE_TURNSTILE_SITE_KEY` set in Vercel env vars and `.env.local` (already done)
- `TURNSTILE_SECRET_KEY` set in Supabase secrets (already done)
- `SUPABASE_ANON_KEY` available in Supabase edge function secrets (already set -- used by existing edge functions)
- Cloudflare Turnstile script loaded via `<script>` tag in `index.html`
- No new npm packages required

### Testing Strategy

**Unit Tests (update existing):**
- `LoginForm.test.tsx`: Mock `window.turnstile`, verify Turnstile widget renders, verify token passed to onSubmit, verify inline error when token missing
- `CodeEntryForm.test.tsx`: Same Turnstile mocking pattern
- Route guard tests: Update `/enter` assertions to `/` where applicable
- Participant page tests: Update `/enter` navigation assertions to `/`

**Manual Testing:**
1. Visit `/` -- verify participant code entry form appears with Turnstile widget
2. Visit `/login` -- verify admin/judge login form appears with Turnstile widget
3. Submit participant form with valid codes -- verify Turnstile token verified, login succeeds
4. Submit admin form with valid credentials -- verify Turnstile token verified, login succeeds, session established
5. Submit forms without completing Turnstile -- verify inline error shown
6. Test with browser DevTools: block Turnstile script, verify forms degrade gracefully
7. Test invalid credentials after Turnstile passes -- verify error messages unchanged
8. Test participant logout -- verify redirect to `/`
9. Test `/enter` -- verify 404 page
10. Click "Are you a judge? Sign in here" link -- verify navigates to `/login`

### Notes

- **Risk: `setSession` race condition** -- Mitigated by setting `sessionUserIdRef` before calling `setSession()` in `AuthProvider.signIn`. The `onAuthStateChange` SIGNED_IN guard will skip redundant processing.
- **Risk: `setSession` failure (S2)** -- Mitigated by checking `setSession` return value. If it fails, all auth state is rolled back (user, sessionUserId, cache cleared) and error thrown. Prevents inconsistent state where user appears logged in but has no valid Supabase session.
- **Risk: Turnstile script not loading** -- Mitigated by graceful handling in the `Turnstile` component (renders nothing if `window.turnstile` undefined). Form validation catches missing token at submit time.
- **Risk: Turnstile token expiry (S3)** -- Mitigated by auto-resetting the Turnstile widget on `expired-callback`. User gets a fresh token without needing to refresh the page.
- **Risk: Edge function cold start** -- First login after deploy may have slight latency from edge function cold start. This is inherent to Supabase edge functions and not specific to this change.
- **Known limitation: Raw Supabase Auth endpoint (S1)** -- The `signInWithPassword` endpoint on Supabase Auth is still publicly accessible via the anon key, bypassing Turnstile. A bot could call it directly. This is acceptable because: (a) Supabase has built-in rate limiting on auth endpoints (default 30 attempts/hour per IP), (b) Turnstile protects the primary UI path where real users interact, (c) disabling the raw endpoint would break password recovery and other auth flows. The combination of Turnstile (UI) + Supabase rate limiting (API) provides layered defense.
- **Defensive note: `MISSING_FIELDS` error (S4)** -- The `verify-admin-login` edge function returns `MISSING_FIELDS` if email/password/token are missing. The client-side error mapping doesn't explicitly handle this code (falls through to `SERVER_ERROR` / "Something went wrong"). This is acceptable because form validation prevents empty submissions from reaching the edge function.
- **Participant auth does NOT use Supabase Auth** -- The `validate-participant` edge function only needs Turnstile verification added. No session token changes needed for participant flow.
- **Password recovery flow is unaffected** -- `resetPassword`, `updatePassword` in `authApi.ts` still call Supabase Auth directly (no Turnstile needed for password reset -- user already authenticated via email link).
- **Critical: `supabase.functions.invoke` error handling (F9)** -- When edge functions return HTTP 400, `supabase.functions.invoke` populates `error` and sets `data` to null. Our error codes are in the response body, so `authApi.signIn` must extract them from `error.context` (a `Response` object) via `.json()`. This is a known Supabase JS v2 behavior. See Task 4 code for implementation.
- **Turnstile reset on failure (F8)** -- Turnstile tokens are single-use. After a failed form submission (e.g., wrong credentials), the consumed token cannot be reused. Both LoginForm and CodeEntryForm must call `turnstileRef.current?.reset()` in the catch block to get a fresh token for retry.
- **Future consideration:** If Turnstile causes issues (e.g., blocking legitimate users in certain regions), the `TURNSTILE_FAILED` error code could be changed to a warning-only mode by skipping the server-side check. This is out of scope but architecturally supported.

## Review Notes
- Adversarial review completed
- Findings: 15 total, 8 fixed, 4 noise (out of scope), 3 undecided (acknowledged)
- Resolution approach: auto-fix
- Fixed: F1 (script race condition - added polling), F4 (added Turnstile.test.tsx with 8 tests), F6 (added null checks on edge function response), F7 (removed dead setTurnstileReady state), F8 (fixed stale test descriptions), F9 (added remoteip to Turnstile verification), F10 (added TURNSTILE_SECRET_KEY missing warning), F12 (tightened role type in edge function)
