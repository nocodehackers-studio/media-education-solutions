---
title: 'Fix Judge Assignment Edge Function Error & Improve Error UX'
slug: 'fix-judge-assignment-error'
created: '2026-02-02'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Supabase Edge Functions (Deno)', 'Supabase JS Client v2', 'React 19', 'TanStack Query', 'Brevo API', 'Vitest + Testing Library']
files_to_modify: ['supabase/functions/create-judge/index.ts', 'src/features/categories/api/categoriesApi.ts', 'src/features/categories/components/AssignJudgeSheet.tsx', 'src/features/categories/components/AssignJudgeSheet.test.tsx']
code_patterns: ['FunctionsHttpError extraction via error.context (useWithdrawSubmission.ts:30-43)', 'Error code to user message mapping (useWithdrawSubmission.ts:57-66)', 'Toast UX: toast.success/error/warning from @/components/ui']
test_patterns: ['Vitest + Testing Library', 'Mock categoriesApi directly (AssignJudgeSheet.test.tsx)', 'Mock toast from @/components/ui', 'FunctionsHttpError mock with context Response (useWithdrawSubmission.test.ts:32-45)']
---

# Tech-Spec: Fix Judge Assignment Edge Function Error & Improve Error UX

**Created:** 2026-02-02

## Overview

### Problem Statement

Admins cannot assign judges to categories. The `create-judge` edge function returns a non-2xx status code, but the actual error is swallowed by the Supabase SDK's generic `FunctionsHttpError` message ("Edge function returned a non 2XX status code"). This blocks the entire judge assignment and invitation pipeline.

**Root Cause:** `categoriesApi.assignJudge()` at line 283 does `if (error) throw error;` — throwing the raw `FunctionsHttpError` without extracting the actual error from `error.context`. The codebase has an established pattern for this extraction (see `useWithdrawSubmission.ts:30-43`) that was not applied here.

### Solution

1. Update `create-judge` edge function to return standardized error codes (matching the pattern set by `withdraw-submission`)
2. Fix error extraction in `categoriesApi.assignJudge()` using the established `FunctionsHttpError.context` extraction pattern
3. Map error codes to user-friendly messages in `AssignJudgeSheet.tsx` (following `useWithdrawSubmission.ts:57-66` pattern)
4. Add inline documentation for the judge assignment flow
5. Update tests to verify new error behavior

### Scope

**In Scope:**
- `create-judge` edge function: standardize error codes + add documentation
- `categoriesApi.assignJudge()`: fix `FunctionsHttpError` extraction
- `AssignJudgeSheet.tsx`: error code → user-friendly message mapping + UX copy
- `AssignJudgeSheet.test.tsx`: update error test expectations
- Deploy updated edge function

**Out of Scope:**
- `send-judge-invitation` edge function (separate flow, triggered on category close)
- Changes to the judge invitation email template
- Other edge functions unrelated to judge assignment
- Changes to `useAssignJudge.ts` (delegates to API layer, no changes needed)

## Context for Development

### Codebase Patterns

**Error Extraction Pattern (ESTABLISHED — follow exactly):**
From `src/features/submissions/hooks/useWithdrawSubmission.ts:30-43`:
```typescript
if (error) {
  let code = ''
  try {
    const ctx = (error as unknown as { context?: Response }).context
    if (ctx instanceof Response) {
      const body = await ctx.json()
      code = body?.error ?? ''
    }
  } catch { /* Response parsing failed */ }
  throw new Error(code || 'Fallback message')
}
```

**Error Code → User Message Pattern (LOCAL, not via errorCodes.ts):**
From `useWithdrawSubmission.ts:57-66`:
```typescript
const code = error instanceof Error ? error.message : ''
const errorMessages: Record<string, string> = {
  DEADLINE_PASSED: 'Deadline has passed — submission is locked',
  CATEGORY_CLOSED: 'This category is no longer accepting changes',
}
toast.error(errorMessages[code] || 'Failed to withdraw submission')
```

**Edge Function Error Response Format:**
All edge functions return `{ error: 'ERROR_CODE' }` with HTTP 400 on failure.

### Files to Reference

| File | Purpose | Key Lines |
| ---- | ------- | --------- |
| `supabase/functions/create-judge/index.ts` | Edge function — needs error code standardization | L93-96 (role conflict), L122-128 (catch block) |
| `src/features/categories/api/categoriesApi.ts` | API layer — `assignJudge()` has broken error handling | L280-286 (error throw) |
| `src/features/categories/components/AssignJudgeSheet.tsx` | UI sheet — error toast shows raw SDK message | L98-102 (catch block) |
| `src/features/categories/components/AssignJudgeSheet.test.tsx` | Existing tests — error test needs update | L198-224 |
| `src/features/submissions/hooks/useWithdrawSubmission.ts` | **Reference** — established error extraction pattern | L30-43, L57-66 |
| `src/features/submissions/hooks/useWithdrawSubmission.test.ts` | **Reference** — FunctionsHttpError mock helper | L32-45 |

### Technical Decisions

- Follow the established `FunctionsHttpError` extraction pattern from `useWithdrawSubmission.ts`
- Edge function returns error CODES (not messages) — consistent with `withdraw-submission`
- Error code → user message mapping is LOCAL in the component (not via `errorCodes.ts`) — matches the established edge function error pattern
- User-facing errors follow UX copy best practices: specific, actionable, no technical jargon

## Implementation Plan

### Tasks

- [x] **Task 1: Standardize error codes in `create-judge` edge function**
  - File: `supabase/functions/create-judge/index.ts`
  - Action: Replace human-readable error messages with standardized error codes in all `throw new Error()` calls. Add JSDoc documentation at the top of the function explaining the flow and error codes.
  - Error code mapping:
    - `'Missing authorization header'` → `UNAUTHORIZED`
    - `'Unauthorized'` → `UNAUTHORIZED`
    - `'Admin access required'` → `UNAUTHORIZED`
    - `'Email is required'` → `EMAIL_REQUIRED`
    - `'Invalid email format'` → `EMAIL_INVALID`
    - `'User exists with a different role'` → `ROLE_CONFLICT`
    - Auth creation errors → `CREATE_FAILED`
    - Generic catch → `UNKNOWN_ERROR`
  - Notes: The catch block at L122-128 should map error codes into the `{ error: code }` response body. Keep the existing HTTP 400 status.

- [x] **Task 2: Fix error extraction in `categoriesApi.assignJudge()`**
  - File: `src/features/categories/api/categoriesApi.ts`
  - Action: Replace `if (error) throw error;` at L283 with the established `FunctionsHttpError` context extraction pattern from `useWithdrawSubmission.ts:30-43`.
  - Exact change at L280-286:
    ```typescript
    // BEFORE:
    if (error) throw error;
    if (data.error) throw new Error(data.error);

    // AFTER:
    if (error) {
      let code = ''
      try {
        const ctx = (error as unknown as { context?: Response }).context
        if (ctx instanceof Response) {
          const body = await ctx.json()
          code = body?.error ?? ''
        }
      } catch { /* Response parsing failed */ }
      throw new Error(code || 'JUDGE_ASSIGN_FAILED')
    }
    if (data?.error) throw new Error(data.error);
    ```
  - Notes: Also add null-safe access to `data?.error` (currently `data.error` which throws if `data` is null). Add a JSDoc comment to the `assignJudge` method documenting the error codes it can throw.

- [x] **Task 3: Update `AssignJudgeSheet.tsx` with UX-friendly error mapping**
  - File: `src/features/categories/components/AssignJudgeSheet.tsx`
  - Action: Replace the catch block at L98-102 with an error code → user message mapping following the `useWithdrawSubmission.ts:57-66` pattern.
  - Error code → user-friendly message mapping:
    ```typescript
    const code = error instanceof Error ? error.message : ''
    const errorMessages: Record<string, string> = {
      UNAUTHORIZED: 'Your session has expired. Please sign in again.',
      ROLE_CONFLICT: 'This email is already registered with a different account type.',
      CREATE_FAILED: 'Unable to create the judge account. Please try again.',
      EMAIL_REQUIRED: 'Please enter an email address.',
      EMAIL_INVALID: 'Please enter a valid email address.',
    }
    toast.error(errorMessages[code] || 'Something went wrong while assigning the judge. Please try again.')
    ```
  - UX Copy Rationale:
    - **UNAUTHORIZED**: Actionable — tells user what to do (sign in again)
    - **ROLE_CONFLICT**: Specific — explains why it failed without exposing role details
    - **CREATE_FAILED**: Gentle — acknowledges failure, suggests retry
    - **Fallback**: Friendly — no technical jargon, suggests retry
  - Notes: `EMAIL_REQUIRED` and `EMAIL_INVALID` should rarely trigger (client-side Zod validation catches these first) but provide fallback safety.

- [x] **Task 4: Update tests**
  - File: `src/features/categories/components/AssignJudgeSheet.test.tsx`
  - Action: Update the error test at L198-224 to verify:
    1. When `assignJudge` rejects with `new Error('ROLE_CONFLICT')`, toast shows "This email is already registered with a different account type."
    2. When `assignJudge` rejects with `new Error('UNKNOWN_CODE')`, toast shows the generic fallback message.
  - Notes: Follow existing test structure. No new test file needed — extend the existing test.

- [x] **Task 5: Add documentation comments**
  - Files: `supabase/functions/create-judge/index.ts`, `src/features/categories/api/categoriesApi.ts`
  - Action: Add JSDoc block at top of `create-judge` edge function documenting:
    - Purpose and flow (auth check → email validation → user lookup/creation)
    - Error codes returned and when each triggers
    - The relationship between `create-judge` and `send-judge-invitation` (separate flows)
  - Action: Update JSDoc on `assignJudge()` method in `categoriesApi.ts` documenting:
    - The `FunctionsHttpError` extraction pattern used
    - Error codes that can be thrown and their meanings
  - Notes: Keep comments concise — a dev should understand the flow without reading the full implementation.

- [x] **Task 6: Deploy updated edge function**
  - Action: Run `npx supabase functions deploy create-judge` to deploy the updated error codes
  - Notes: Must deploy BEFORE testing client-side changes, since the client now expects error codes not messages.

### Acceptance Criteria

- [x] **AC1:** Given an admin assigning a judge with an email that belongs to a non-judge user, when the form is submitted, then the toast shows "This email is already registered with a different account type." (not the raw SDK error).
- [x] **AC2:** Given an admin assigning a judge with a valid new email, when the `create-judge` edge function succeeds, then the judge is assigned and a success toast is shown.
- [x] **AC3:** Given an admin whose session has expired, when they try to assign a judge, then the toast shows "Your session has expired. Please sign in again."
- [x] **AC4:** Given any unexpected edge function failure, when the form is submitted, then the toast shows "Something went wrong while assigning the judge. Please try again." (never the raw SDK message "Edge function returned a non 2XX status code").
- [x] **AC5:** Given the `create-judge` edge function returns a 400 error, when `categoriesApi.assignJudge()` handles it, then the actual error code from the response body is extracted and thrown (not the generic `FunctionsHttpError` message).
- [x] **AC6:** Given the updated test suite, when `npx vitest run src/features/categories/components/AssignJudgeSheet.test.tsx` is executed, then all tests pass including error message mapping tests.

## Additional Context

### Dependencies

- Supabase online instance (cyslxhojwlhbeabgvngv.supabase.co)
- Edge function `create-judge` must be deployed with updated error codes BEFORE testing client changes
- No new npm dependencies needed

### Testing Strategy

**Unit Tests (update existing):**
- `AssignJudgeSheet.test.tsx`: Update error test to verify error code → user message mapping
- Add one test for known error code (e.g., `ROLE_CONFLICT`) → specific message
- Add one test for unknown error code → generic fallback message

**Manual Testing:**
1. Deploy updated `create-judge` edge function
2. As admin, try assigning a judge with a new email → should succeed
3. Try assigning a judge with an email that belongs to an admin → should show "This email is already registered with a different account type."
4. Verify the generic fallback never shows the raw SDK error

### Notes

- The `create-judge` edge function logic is likely correct — the issue is the client not reading the error response. Once the client-side fix is in place, the actual error will be visible and any edge function logic bugs can be diagnosed.
- `useAssignJudge.ts` needs NO changes — it delegates to `categoriesApi.assignJudge()`.
- The `_invokeJudgeInvitation` method also calls an edge function but already handles errors via a `{ success, error }` return pattern — not affected by this fix.
- Edge function error codes are mapped LOCALLY in the component (not via `errorCodes.ts`) to stay consistent with the `useWithdrawSubmission` pattern where edge function errors are separate from database query errors.

## Adversarial Review Findings

The following findings were identified during adversarial review and MUST be addressed during implementation.

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| F1 | **Critical** | Collapsing 3 auth failures (`Missing authorization header`, `Unauthorized`, `Admin access required`) into a single `UNAUTHORIZED` code is misleading. "Admin access required" means the user IS authenticated but lacks the role — showing "Your session has expired" is wrong. | Split into `UNAUTHORIZED` (bad/missing token) and `FORBIDDEN` (authenticated but not admin). Map `FORBIDDEN` → "You don't have permission to assign judges." |
| F2 | **Critical** | The `updateError` at `categoriesApi.ts:300` (category DB update after judge creation) is unhandled. A raw `PostgrestError` will hit the toast (e.g. "violates row-level security policy"). The spec only fixes edge function errors — half the error paths are still broken. | Wrap the category update in try/catch, throw `JUDGE_ASSIGN_FAILED` on DB error so it hits the generic fallback message. |
| F3 | **High** | No unit test for the `FunctionsHttpError` extraction code in `categoriesApi.assignJudge()`. The core fix has zero test coverage — `AssignJudgeSheet.test.tsx` mocks `assignJudge()` entirely. | Add an API-layer test file `categoriesApi.test.ts` with mocked `supabase.functions.invoke` returning a `FunctionsHttpError`-shaped object. |
| F4 | **High** | Architectural layer mismatch: `useWithdrawSubmission.ts` does extraction in the *hook*; the spec puts extraction in the *API layer*. | Justified deviation: `useWithdrawSubmission` calls `supabase.functions.invoke` directly in the hook; `assignJudge()` calls it in the API layer (where the SDK call lives). Extraction belongs where the SDK call is. Document this in the JSDoc. |
| F5 | **High** | `useAssignJudge.ts` has no `onError` callback. If `mutate` (non-async) is ever used or the hook is called from another component, errors are silently swallowed. The reference pattern uses `onError` for toast display. | Move error code → user message mapping to `useAssignJudge.ts` `onError` callback. Move success toasts to `onSuccess`. Simplify `AssignJudgeSheet.tsx` catch block to UI-flow only (close sheet). |
| F6 | **Medium** | Test plan is too thin — only 2 test cases. Missing: UNAUTHORIZED, FORBIDDEN, CREATE_FAILED, network failures, non-Error rejections. Reference test has 5+ scenarios. | Expand test plan to cover all error codes plus network failure and unknown code scenarios. |
| F7 | **Medium** | Fragile string matching at edge function L100: `lookupError.message?.includes('not found')` will break if Supabase SDK changes wording. | Fix to use error status/code checking instead of string matching. |
| F8 | **Medium** | No backward compatibility analysis for deployment order. Spec says deploy edge function first but doesn't confirm current client still works during the gap. | Add analysis: Current client does `if (error) throw error` which throws the generic SDK message regardless of response body content. Changing the body from messages to codes has zero impact on the current client. Backward compatible — safe to deploy first. |
| F9 | **Medium** | Single HTTP 400 for all error types kills observability. Auth failures should be 401/403, validation 422, conflicts 409. | Use semantic HTTP status codes in `create-judge`: 401 (UNAUTHORIZED), 403 (FORBIDDEN), 409 (ROLE_CONFLICT), 422 (EMAIL_REQUIRED, EMAIL_INVALID), 500 (CREATE_FAILED, UNKNOWN_ERROR). |
| F10 | **Low** | `JUDGE_ASSIGN_FAILED` and `UNKNOWN_ERROR` codes are not in the component error mapping — they fall through to generic fallback. | Intentional by design. Document explicitly: these codes deliberately fall through to the generic fallback "Something went wrong…" message. No mapping needed. |
| F11 | **Low** | `data.error` check after the fix is dead code. On 200, edge function returns `{ judgeId, isExisting }` (no error field). On 400+, FunctionsHttpError path catches first. | Remove the `data?.error` check. After FunctionsHttpError extraction, only check `data?.judgeId` for the success path. |
| F12 | **Low** | Toast import discrepancy: `useWithdrawSubmission.ts` imports from `sonner`, `AssignJudgeSheet.tsx` from `@/components/ui`. | `@/components/ui` re-exports sonner's `toast`. Use `@/components/ui` import in all project code (per project conventions). Document in spec. |
| F13 | **Low** | Race condition: two admins assigning same new email simultaneously. Second call may fail because profile trigger hasn't fired yet. | Known limitation. The `CREATE_FAILED` error code and retry message cover this case. Document as a known edge case in the Notes section. |
| F14 | **Low** | CORS wildcard `Access-Control-Allow-Origin: '*'` on an admin-only endpoint. | Out of scope — all edge functions in the project use this pattern. Note for future security hardening. |

## Review Notes

- Adversarial review completed (post-implementation)
- Findings: 15 total, 6 fixed, 9 skipped (pre-existing/noise/out-of-scope)
- Resolution approach: auto-fix
- Fixed: F1 (Response.clone), F2 (fallthrough comment), F5 (method validation), F11 (judgeId guard), F12 (EdgeError.name), F13 (body parse error)
- Skipped: F3, F4, F6, F7, F8, F9, F10, F14, F15
