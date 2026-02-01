# Story 6.5: Generate Winners Page

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Super Admin**,
I want **to generate a password-protected winners page**,
so that **results can be shared securely with stakeholders**.

## Acceptance Criteria

1. **Given** I am on a contest in "Reviewed" status **When** I want to generate the winners page **Then** I must first complete a category-by-category approval process via the Winners tab on ContestDetailPage.

2. **Given** I start the approval process **When** I view a category **Then** I see: category name, all submissions, judge's ratings and rankings, any admin overrides applied, current top 3 winners (effective: admin override if present, else judge's pick, excluding disqualified).

3. **Given** I review a category **When** I am satisfied with the results **Then** I click "Approve Category" **And** the category is marked as approved (`approved_for_winners = true`, `approved_at = now()`).

4. **Given** I have NOT approved all categories **When** I try to generate winners page **Then** the "Generate Winners Page" button is disabled **And** I see: "Approve all categories before publishing (X of Y approved)".

5. **Given** all categories are approved **When** I click "Generate Winners Page" **Then** I see the winners page setup form with: password input (required, min 6 characters), confirm password, password strength indicator, and a "Preview" button.

6. **Given** I click "Preview" **When** the preview loads **Then** I see exactly what viewers will see after entering password: all top 3 winners per category with participant name, institution, category, and media thumbnail.

7. **Given** I set a valid password and click "Generate" **When** the page is created **Then** `winners_page_password` is stored, `winners_page_enabled = true`, `winners_page_generated_at = now()` **And** a unique URL is generated: `/winners/{contest-code}` **And** I see the URL to share **And** I can copy the URL to clipboard **And** the contest status changes to "Finished".

8. **Given** I want to update the password later **When** I go to winners page settings **Then** I can change the password **And** existing links remain valid (only password changes).

9. **Given** I want to regenerate after changes **When** I click "Regenerate Winners Page" **Then** I must re-approve any modified categories **And** the URL remains the same.

10. **Given** I want to revoke access **When** I click "Revoke Winners Page" **Then** `winners_page_enabled = false` **And** the page shows "Results not available" to public viewers (Story 6.6 will read this flag).

## Tasks / Subtasks

- [x] Task 1: Database migration — add category approval columns (AC: #3)
  - [x] 1.1 Create migration `supabase/migrations/<timestamp>_add_winners_approval_columns.sql`
  - [x] 1.2 Add `approved_for_winners BOOLEAN DEFAULT false` to `categories` table
  - [x] 1.3 Add `approved_at TIMESTAMPTZ` to `categories` table
  - [x] 1.4 Run `npx supabase db push` to apply

- [x] Task 2: Database migration — add winners page tracking columns to contests (AC: #7)
  - [x] 2.1 In same migration file, add `winners_page_enabled BOOLEAN DEFAULT false` to `contests` table
  - [x] 2.2 Add `winners_page_generated_at TIMESTAMPTZ` to `contests` table
  - [x] 2.3 Note: `winners_page_password TEXT` column already exists — NO need to add it
  - [x] 2.4 Run `npx supabase db push` to apply

- [x] Task 3: Update types with new fields (AC: #3, #7)
  - [x] 3.1 Update `ContestRow` in `src/features/contests/types/contest.types.ts` — add `winners_page_enabled: boolean`, `winners_page_generated_at: string | null`
  - [x] 3.2 Update `Contest` interface — add `winnersPageEnabled: boolean`, `winnersPageGeneratedAt: string | null`
  - [x] 3.3 Update `transformContestRow()` to map new fields
  - [x] 3.4 Create new type file `src/features/contests/types/winners.types.ts`:
    - `CategoryApprovalStatus` interface: `{ categoryId: string, categoryName: string, divisionName: string, type: 'video' | 'photo', judgingCompleted: boolean, approvedForWinners: boolean, approvedAt: string | null, submissionCount: number, reviewCount: number, rankingCount: number }`
    - `EffectiveWinner` interface: `{ rank: number, submissionId: string, participantName: string, institution: string, categoryName: string, mediaType: string, mediaUrl: string, thumbnailUrl: string | null }`
    - `CategoryWinners` interface: `{ categoryId: string, categoryName: string, divisionName: string, winners: EffectiveWinner[] }`

- [x] Task 4: API — category approval methods (AC: #3, #9)
  - [x] 4.1 Create `src/features/contests/api/winnersApi.ts`
  - [x] 4.2 Add `approveCategory(categoryId: string): Promise<void>` — UPDATE categories SET `approved_for_winners = true`, `approved_at = now()` WHERE id = categoryId
  - [x] 4.3 Add `unapproveCategory(categoryId: string): Promise<void>` — UPDATE categories SET `approved_for_winners = false`, `approved_at = null` WHERE id = categoryId
  - [x] 4.4 Add `getCategoryApprovalStatus(contestId: string): Promise<CategoryApprovalStatus[]>` — query categories via divisions for the contest, join with submissions count, reviews count, rankings count, and include `approved_for_winners`, `approved_at`, `judging_completed_at`

- [x] Task 5: API — winners page management methods (AC: #7, #8, #10)
  - [x] 5.1 In `winnersApi.ts`, add `generateWinnersPage(contestId: string, password: string): Promise<void>`:
    - UPDATE contests SET `winners_page_password = password`, `winners_page_enabled = true`, `winners_page_generated_at = now()`, `status = 'finished'` WHERE id = contestId
  - [x] 5.2 Add `updateWinnersPassword(contestId: string, password: string): Promise<void>`:
    - UPDATE contests SET `winners_page_password = password` WHERE id = contestId
  - [x] 5.3 Add `revokeWinnersPage(contestId: string): Promise<void>`:
    - UPDATE contests SET `winners_page_enabled = false` WHERE id = contestId
  - [x] 5.4 Add `reactivateWinnersPage(contestId: string): Promise<void>`:
    - UPDATE contests SET `winners_page_enabled = true`, `winners_page_generated_at = now()` WHERE id = contestId

- [x] Task 6: API — effective rankings query for preview (AC: #2, #6)
  - [x] 6.1 In `winnersApi.ts`, add `getEffectiveWinners(contestId: string): Promise<CategoryWinners[]>`:
    - Query all approved categories for the contest (via divisions)
    - For each category, query rankings with rank 1-3
    - Join with submissions (for media_url, thumbnail_url, media_type, status) and participants (for name, organization_name)
    - Apply effective ranking logic: use `admin_ranking_override` submission if present, else use `submission_id`
    - Filter out disqualified submissions (status = 'disqualified') — show empty position if winner is disqualified
    - Return structured CategoryWinners array

- [x] Task 7: Create mutation hooks (AC: #3, #7, #8, #10)
  - [x] 7.1 Create `src/features/contests/hooks/useApproveCategory.ts` — `useMutation` calling `winnersApi.approveCategory()`, invalidates `['winners', 'approval-status']` query
  - [x] 7.2 Create `src/features/contests/hooks/useGenerateWinnersPage.ts` — `useMutation` calling `winnersApi.generateWinnersPage()`, invalidates `['contests']` and `['contest', contestId]`
  - [x] 7.3 Create `src/features/contests/hooks/useWinnersManagement.ts` — exports `useUpdateWinnersPassword`, `useRevokeWinnersPage`, `useReactivateWinnersPage` mutations
  - [x] 7.4 Create `src/features/contests/hooks/useCategoryApprovalStatus.ts` — `useQuery` wrapping `winnersApi.getCategoryApprovalStatus()`
  - [x] 7.5 Create `src/features/contests/hooks/useEffectiveWinners.ts` — `useQuery` wrapping `winnersApi.getEffectiveWinners()`
  - [x] 7.6 Export all from `src/features/contests/hooks/index.ts`

- [x] Task 8: Create CategoryApprovalList component (AC: #1, #2, #3, #4)
  - [x] 8.1 Create `src/features/contests/components/CategoryApprovalList.tsx`
  - [x] 8.2 Props: `contestId: string`
  - [x] 8.3 Use `useCategoryApprovalStatus(contestId)` to fetch category data
  - [x] 8.4 Display table/card list with columns: Category Name, Division, Type, Judging Status (complete/incomplete), Submissions, Reviews, Rankings, Approval Status, Actions
  - [x] 8.5 "Approve" button (green) for unapproved categories where judging is complete — calls `useApproveCategory`
  - [x] 8.6 "Revoke Approval" button for already-approved categories — calls unapprove
  - [x] 8.7 Disable approval for categories where `judging_completed_at IS NULL` — show "Judging not complete" tooltip
  - [x] 8.8 Show progress: "X of Y categories approved" with visual indicator
  - [x] 8.9 Link to category rankings page for detailed review before approving

- [x] Task 9: Create WinnersSetupForm component (AC: #5, #7, #8, #10)
  - [x] 9.1 Create `src/features/contests/components/WinnersSetupForm.tsx`
  - [x] 9.2 Props: `contest: Contest`, `allCategoriesApproved: boolean`, `onPreview: () => void`
  - [x] 9.3 If winners page NOT yet generated (contest status = 'reviewed'):
    - Password input (required, min 6 chars) with Zod validation
    - Confirm password input (must match)
    - Simple password strength indicator (weak/medium/strong based on length + complexity)
    - "Preview" button (opens preview dialog)
    - "Generate Winners Page" button — disabled until all categories approved AND password valid
    - On generate: call `useGenerateWinnersPage` mutation
  - [x] 9.4 If winners page already generated (contest status = 'finished'):
    - Show generated URL: `/winners/{contest.contestCode}` with copy-to-clipboard button
    - Show `winnersPageGeneratedAt` timestamp
    - "Change Password" section (new password + confirm)
    - Winners page status: "Active" / "Revoked" based on `winnersPageEnabled`
    - "Revoke Winners Page" button (when active) — calls revoke mutation
    - "Reactivate Winners Page" button (when revoked) — calls reactivate mutation
  - [x] 9.5 Use React Hook Form + Zod for password form validation
  - [x] 9.6 Use shadcn `Input`, `Button`, `Card`, `CardContent`, `CardHeader`

- [x] Task 10: Create WinnersPreviewDialog component (AC: #6)
  - [x] 10.1 Create `src/features/contests/components/WinnersPreviewDialog.tsx`
  - [x] 10.2 Props: `contestId: string`, `contestName: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`
  - [x] 10.3 Use `useEffectiveWinners(contestId)` to fetch winners data
  - [x] 10.4 Display each category with top 3 winners:
    - Category name + division name header
    - For each winner (1st, 2nd, 3rd): position badge (gold/silver/bronze styling), participant name, institution, media thumbnail
    - If position is empty (disqualified winner): show "Position vacant" placeholder
  - [x] 10.5 Use shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `ScrollArea`
  - [x] 10.6 Show loading skeleton while data loads

- [x] Task 11: Create AdminWinnersTab component (AC: #1, #2, #3, #4, #5)
  - [x] 11.1 Create `src/features/contests/components/AdminWinnersTab.tsx`
  - [x] 11.2 Props: `contest: Contest`
  - [x] 11.3 Compose: CategoryApprovalList + WinnersSetupForm
  - [x] 11.4 Layout: Category approval section at top, setup form below (or side-by-side on larger screens)
  - [x] 11.5 Pass `allCategoriesApproved` computed flag to WinnersSetupForm
  - [x] 11.6 Wire preview button to WinnersPreviewDialog
  - [x] 11.7 Export from components/index.ts

- [x] Task 12: Update ContestDetailPage — add Winners tab (AC: #1)
  - [x] 12.1 Import `AdminWinnersTab` from contests feature
  - [x] 12.2 Add 6th tab "Winners" — visible only when contest status is `'reviewed'` or `'finished'`
  - [x] 12.3 Render AdminWinnersTab with contest data
  - [x] 12.4 If contest transitions to "Finished" after generation, the tab should remain visible and show management controls

- [x] Task 13: Update feature exports (AC: all)
  - [x] 13.1 Update `src/features/contests/components/index.ts` — add CategoryApprovalList, WinnersSetupForm, WinnersPreviewDialog, AdminWinnersTab
  - [x] 13.2 Update `src/features/contests/hooks/index.ts` — add all new hooks
  - [x] 13.3 Update `src/features/contests/index.ts` — add new exports and types
  - [x] 13.4 Update `PROJECT_INDEX.md`

- [x] Task 14: Unit tests (AC: all)
  - [x] 14.1 `src/features/contests/components/CategoryApprovalList.test.tsx` — displays categories, approve/revoke buttons, disabled for incomplete judging, progress indicator
  - [x] 14.2 `src/features/contests/components/WinnersSetupForm.test.tsx` — password validation, generate button disabled state, URL display, revoke/reactivate
  - [x] 14.3 `src/features/contests/hooks/useApproveCategory.test.ts` — mutation call, query invalidation
  - [x] 14.4 `src/features/contests/hooks/useGenerateWinnersPage.test.ts` — mutation call, query invalidation

### Review Follow-ups (AI)

- [ ] [AI-Review][CRITICAL] Update Category Approval link to the category rankings page (task 8.9 marked done but currently links to submissions). [src/features/contests/components/CategoryApprovalList.tsx:121]
- [ ] [AI-Review][CRITICAL] Update PROJECT_INDEX.md to include winners components/hooks/types (task 13.4 marked done but file not updated). [PROJECT_INDEX.md:11]
- [ ] [AI-Review][HIGH] Implement approval-category detail view that shows submissions, ratings, rankings, overrides, and top 3 winners (AC2). [src/features/contests/components/CategoryApprovalList.tsx:100]
- [ ] [AI-Review][HIGH] Add Regenerate Winners Page flow (AC9) with re-approval enforcement and stable URL. [src/features/contests/components/WinnersSetupForm.tsx:140]
- [ ] [AI-Review][MEDIUM] Update pre-generate copy to include approval counts: "Approve all categories before publishing (X of Y approved)". [src/features/contests/components/WinnersSetupForm.tsx:264]
- [ ] [AI-Review][MEDIUM] Disable Generate button until password is valid (currently only checks approvals). [src/features/contests/components/WinnersSetupForm.tsx:313]
- [ ] [AI-Review][MEDIUM] Filter review count query to contest submissions to avoid scanning all reviews. [src/features/contests/api/winnersApi.ts:57]
- [ ] [AI-Review][MEDIUM] Populate Dev Agent Record file list from git status (currently empty). [_bmad-output/implementation-artifacts/6-5-generate-winners-page.md:474]

## Dev Notes

### Architecture Decisions

- **Winners API in contests feature:** Create `winnersApi.ts` inside `src/features/contests/api/` — winners management is a contest-level concern, not a separate feature. Keeps exports within the existing `contests` feature boundary.
- **Plaintext password storage:** The existing `winners_page_password TEXT` column stores plaintext. Contest view passwords are low-security (not user credentials). Story 6.6 will implement server-side comparison. If hashing is needed later, add bcryptjs at that point. No crypto dependency needed for 6.5.
- **No public route in this story:** The public `/winners/:contestSlug` page is Story 6.6. This story generates the URL string for display to the admin (based on `contest.contestCode`). The URL pattern is `/winners/{contestCode}`.
- **Effective ranking logic in TypeScript:** No new RPC needed. Query rankings + submissions + participants using existing Supabase client patterns. Apply override logic client-side: `effectiveSubmissionId = ranking.admin_ranking_override ?? ranking.submission_id`. Filter out disqualified submissions.
- **Category approval is a simple boolean toggle:** Not a complex workflow. Admin clicks Approve, column is set to true. Revoke sets it back to false. No multi-step approval process.
- **Categories linked via divisions:** Categories don't have a direct `contest_id` FK — they reference `divisions` which reference `contests`. All category queries for a contest must go through: `contests → divisions → categories`.
- **Contest status transition:** Only the "Generate" action transitions contest to "Finished". There is no intermediate "generating" status. The transition is: `reviewed → finished`.
- **Copy to clipboard:** Use `navigator.clipboard.writeText()` — supported in all modern browsers. Show toast on success.

### Database Schema Changes

**Migration: Add winners approval and tracking columns**
```sql
-- Add category approval columns
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS approved_for_winners BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add winners page tracking columns to contests
-- NOTE: winners_page_password already exists as TEXT column
ALTER TABLE public.contests
ADD COLUMN IF NOT EXISTS winners_page_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS winners_page_generated_at TIMESTAMPTZ;
```

### Existing Columns Already in Place

The `contests` table already has:
- `winners_page_password TEXT` — stores the password (plaintext)
- `status TEXT` with CHECK constraint including `'reviewed'` and `'finished'`
- `slug TEXT UNIQUE` — used for URL generation alongside `contest_code`

The `categories` table already has:
- `judging_completed_at TIMESTAMPTZ` — set when judge marks category complete (Story 5-6)

### Category Approval Status Query Pattern

Categories are linked to contests via divisions. Query pattern:

```typescript
async getCategoryApprovalStatus(contestId: string): Promise<CategoryApprovalStatus[]> {
  // Get categories via divisions for this contest
  const { data, error } = await supabase
    .from('categories')
    .select(`
      id, name, type, judging_completed_at, approved_for_winners, approved_at,
      divisions!inner(id, name, contest_id),
      submissions(count),
      reviews:submissions(reviews(count)),
      rankings(count)
    `)
    .eq('divisions.contest_id', contestId)

  // Transform and return
}
```

Note: The exact query shape may need adjustment. The submission/review/ranking counts may require separate queries or creative joins. Keep it simple — if the join is complex, use multiple queries.

### Effective Winners Query Pattern

```typescript
async getEffectiveWinners(contestId: string): Promise<CategoryWinners[]> {
  // 1. Get approved categories for the contest (via divisions)
  const categories = await supabase
    .from('categories')
    .select('id, name, type, divisions!inner(name, contest_id)')
    .eq('divisions.contest_id', contestId)
    .eq('approved_for_winners', true)

  // 2. For each category, get rankings with submission data
  // Rankings include admin_ranking_override
  const rankings = await supabase
    .from('rankings')
    .select(`
      rank, submission_id, admin_ranking_override,
      submission:submissions!submission_id(id, media_url, thumbnail_url, media_type, status,
        participant:participants!participant_id(name, organization_name)
      ),
      override_submission:submissions!admin_ranking_override(id, media_url, thumbnail_url, media_type, status,
        participant:participants!participant_id(name, organization_name)
      )
    `)
    .in('category_id', categoryIds)
    .order('rank')

  // 3. Apply effective logic:
  // effectiveSubmission = admin_ranking_override ? override_submission : submission
  // Skip if effectiveSubmission.status === 'disqualified'
}
```

**Important:** The double-join on `submissions` (for both `submission_id` and `admin_ranking_override`) may need `(supabase.from as any)` cast or separate queries. Follow the pattern established in Story 6-3.

### Password Form Validation (Zod Schema)

```typescript
const winnersPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
```

### Password Strength Indicator

Simple strength calculation (no library needed):
```typescript
function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 6) return 'weak'
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
  if (password.length >= 10 && variety >= 3) return 'strong'
  if (password.length >= 6 && variety >= 2) return 'medium'
  return 'weak'
}
```

### ContestDetailPage Tab Addition

The existing ContestDetailPage has 5 tabs. Add a 6th "Winners" tab:

```tsx
// Only show Winners tab for 'reviewed' or 'finished' contests
{(contest.status === 'reviewed' || contest.status === 'finished') && (
  <TabsTrigger value="winners">Winners</TabsTrigger>
)}

// Tab content
<TabsContent value="winners">
  <AdminWinnersTab contest={contest} />
</TabsContent>
```

### URL Generation Pattern

The winners URL uses the contest code (not slug):
```typescript
const winnersUrl = `${window.location.origin}/winners/${contest.contestCode}`
```

Copy to clipboard:
```typescript
async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
  toast.success('URL copied to clipboard')
}
```

### Existing Components to Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| `Dialog`, `DialogContent`, etc. | `src/components/ui/dialog.tsx` | Preview dialog |
| `Card`, `CardContent`, `CardHeader` | `src/components/ui/card.tsx` | Setup form layout |
| `Button` | `src/components/ui/button.tsx` | Approve, Generate, Revoke buttons |
| `Badge` | `src/components/ui/badge.tsx` | Status indicators |
| `Input` | `src/components/ui/input.tsx` | Password fields |
| `Tabs`, `TabsTrigger`, `TabsContent` | `src/components/ui/tabs.tsx` | Contest detail tabs |
| `ScrollArea` | `src/components/ui/scroll-area.tsx` | Preview dialog scrolling |
| `Skeleton` | `src/components/ui/skeleton.tsx` | Loading states |
| `Table` | `src/components/ui/table.tsx` | Category approval list |
| `Tooltip` | `src/components/ui/tooltip.tsx` | Disabled state explanations |
| `useContest` | `src/features/contests/hooks/useContest.ts` | Fetch contest data |
| `useUpdateContestStatus` | `src/features/contests/hooks/useUpdateContestStatus.ts` | Contest status transition pattern reference |
| `AdminCategoryRankings` | `src/features/submissions/components/AdminCategoryRankings.tsx` | Link to for detailed category review before approving |
| `formatRankingPosition` | `src/features/submissions/types/adminSubmission.types.ts` | Rank display helper (1st, 2nd, 3rd) |

### Edge Cases to Handle

1. **Contest not in "reviewed" status:** Winners tab should not appear for draft/published/closed contests. Only show for reviewed/finished.
2. **Category with no rankings:** Cannot approve — show "No rankings submitted" and disable approve button.
3. **Category with incomplete judging:** Cannot approve — show "Judging not complete" with disabled approve button. Check `judging_completed_at IS NOT NULL`.
4. **All categories approved then one unapproved:** "Generate" button becomes disabled again. Progress indicator updates.
5. **Disqualified winner in preview:** Show "Position vacant" for that rank in the preview. Admin should see this and potentially re-rank before generating.
6. **Password too short:** Zod validation prevents submission. Show inline error.
7. **Passwords don't match:** Zod refinement catches mismatch. Show error on confirm field.
8. **Generate with existing password:** If contest already has a `winners_page_password`, show "Update existing password" option.
9. **Revoke then reactivate:** Reactivation re-enables the page. URL stays the same. Password stays the same.
10. **Regenerate after ranking changes:** Admin must re-approve modified categories. Simple approach: admin manually revokes approval on any category they want to re-review, then re-approves.

### Things NOT in Scope for This Story

- Public `/winners/:contestSlug` page (Story 6.6)
- Password-protected public access and server-side validation (Story 6.6)
- Public winners display with media playback, downloads, animations (Story 6.6)
- Download abuse prevention (Story 6.6)
- Mobile-responsive winners page (Story 6.6)
- Participant feedback view (Story 6.7)
- Automatic "reviewed" status transition (assumed already handled)
- Email notification of winners page generation (Epic 7)
- Password hashing — plaintext is acceptable for contest view passwords

### Testing Policy (STRICT — READ THIS)

**From Story 6-4 lesson: 134 tests ran across 19 files — that is excessive. This MUST NOT happen again.**

```bash
# MANDATORY TESTING RULES:
# 1. ONLY test files you created or directly modified in THIS story
# 2. NEVER run full test suite (npm run test is BANNED)
# 3. NEVER run tests on unchanged files from previous stories
# 4. Use: npx vitest run --changed   (scoped to changed files only)
# 5. Or target specific files: npx vitest run src/features/contests/components/CategoryApprovalList.test.tsx
# 6. HARD LIMITS: Max 50 tests total, Max 5 minutes testing time
# 7. If limits exceeded: STOP testing immediately and move on
# 8. Do NOT "verify" tests from other stories — they are not your concern
```

### Quality Gate

```bash
npm run build              # Must pass
npm run lint               # Must pass
npm run type-check         # Must pass
npx vitest run --changed   # Scoped tests ONLY — NOT full suite
```

### Project Structure Notes

**New files:**
```
supabase/migrations/
  <timestamp>_add_winners_approval_columns.sql        (NEW)

src/features/contests/
  api/winnersApi.ts                                    (NEW)
  types/winners.types.ts                               (NEW)
  components/CategoryApprovalList.tsx                   (NEW)
  components/CategoryApprovalList.test.tsx              (NEW)
  components/WinnersSetupForm.tsx                       (NEW)
  components/WinnersSetupForm.test.tsx                  (NEW)
  components/WinnersPreviewDialog.tsx                   (NEW)
  components/AdminWinnersTab.tsx                        (NEW)
  hooks/useApproveCategory.ts                          (NEW)
  hooks/useApproveCategory.test.ts                     (NEW)
  hooks/useGenerateWinnersPage.ts                      (NEW)
  hooks/useGenerateWinnersPage.test.ts                 (NEW)
  hooks/useWinnersManagement.ts                        (NEW)
  hooks/useCategoryApprovalStatus.ts                   (NEW)
  hooks/useEffectiveWinners.ts                         (NEW)
```

**Modified files:**
```
src/features/contests/
  types/contest.types.ts                               (MODIFIED — add winnersPageEnabled, winnersPageGeneratedAt)
  components/index.ts                                  (MODIFIED — add new exports)
  hooks/index.ts                                       (MODIFIED — add new exports)
  index.ts                                             (MODIFIED — add new exports and types)

src/pages/admin/
  ContestDetailPage.tsx                                (MODIFIED — add Winners tab)

PROJECT_INDEX.md                                       (MODIFIED)
```

**Alignment:** All new files remain within `src/features/contests/` feature boundary. The only page-level change is adding a tab to the existing ContestDetailPage. No new routes needed (public route is Story 6.6). Database migration follows established pattern in `supabase/migrations/`.

### Previous Story Intelligence (6-4)

From Story 6-4 completion notes:
- Used `as Record<string, unknown>` cast for untyped new columns in Supabase client — use same pattern here for new `approved_for_winners`, `approved_at`, `winners_page_enabled`, `winners_page_generated_at` columns
- Judge ranking pool filter is client-side (filter in memo) — effective winners query can follow similar client-side logic
- **Testing lesson: 134 tests across 19 files is excessive.** Keep test scope tight — ONLY test new/modified files
- Edge case: disqualify button only for `status === 'submitted'` — winners preview must also filter out disqualified submissions

From Story 6-4 review follow-ups (open):
- [CRITICAL] AlertDialogAction vs plain Button in confirm dialogs — use correct shadcn AlertDialog* components in this story
- [HIGH] Warning copy mismatch — follow AC copy exactly in this story

From Story 6-3 patterns:
- `(supabase.from as any)` or `as Record<string, unknown>` cast for untyped columns
- Query invalidation: `queryClient.invalidateQueries({ queryKey: ['contests'] })`
- Toast pattern: `toast.success('...')` on mutation success

### Git Intelligence

Recent commits:
- `6-3: Add admin override for feedback & rankings (#28)`
- `6-2: Add admin view for judge ratings & feedback (#27)`
- `6-1: Add Admin View All Submissions page (#26)`
- Commit format: `{story-id}: {action} {what}`
- PRs auto-merged to main
- This story modifies the `contests` feature (not `submissions` like 6-1 through 6-4) — lower merge conflict risk

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-admin-oversight-results-publication.md#Story 6.5]
- [Source: _bmad-output/planning-artifacts/prd/functional-requirements.md — FR54, FR55]
- [Source: _bmad-output/implementation-artifacts/6-4-disqualify-submissions.md — Previous story patterns and testing lesson]
- [Source: _bmad-output/implementation-artifacts/6-3-override-feedback-rankings.md — Override rankings query patterns, effective ranking logic]
- [Source: _bmad-output/project-context.md — All critical rules and patterns]
- [Source: supabase/migrations/00003_create_contests_tables.sql — Contests table schema, winners_page_password already exists]
- [Source: supabase/migrations/20260113001602_create_categories_table.sql — Categories table schema]
- [Source: supabase/migrations/20260201003443_add_judging_completed_at.sql — judging_completed_at column]
- [Source: src/features/contests/types/contest.types.ts — Contest/ContestRow interfaces, ContestStatus type]
- [Source: src/features/contests/api/contestsApi.ts — Existing contest API methods, updateStatus pattern]
- [Source: src/features/contests/hooks/ — Existing hooks: useContest, useUpdateContestStatus]
- [Source: src/features/contests/index.ts — Current exports]
- [Source: src/pages/admin/ContestDetailPage.tsx — 5-tab layout to extend with Winners tab]
- [Source: src/features/submissions/api/adminSubmissionsApi.ts — Rankings query with admin override pattern]
- [Source: src/features/submissions/types/adminSubmission.types.ts — formatRankingPosition helper, effective ranking fields]
- [Source: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md — Architecture patterns, category-division-contest hierarchy]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

### File List
