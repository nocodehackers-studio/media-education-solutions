# UX Consistency Patterns

## Button Hierarchy

| Level | Style | Usage |
|-------|-------|-------|
| **Primary** | Solid, brand color | One per screen — the main action (Submit, Publish, Save) |
| **Secondary** | Outlined | Alternative actions (Cancel, Back, Save Draft) |
| **Ghost** | Text only | Tertiary actions (Learn more, View details) |
| **Destructive** | Red solid | Dangerous actions (Delete, Remove) — always with confirmation |

**Rules:**
- Never more than one Primary button visible at a time
- Destructive actions require confirmation dialog
- Button text uses verbs: "Submit Entry" not "Submission"

## Feedback Patterns

| Type | Style | Duration | Usage |
|------|-------|----------|-------|
| **Success** | Green toast, top-right | 4 seconds | Confirmations: "Contest published", "Rating saved" |
| **Error** | Red toast, top-right | Until dismissed | Failures: "Upload failed", "Connection lost" |
| **Warning** | Amber inline | Persistent | Deadlines: "Deadline in 2 hours" |
| **Info** | Blue inline | Persistent | Guidance: "Judges will see anonymous codes only" |

**Rules:**
- Success toasts auto-dismiss
- Error toasts require user dismissal (with clear action)
- Never stack more than 2 toasts
- Inline messages for contextual warnings (near the relevant element)

## Form Patterns

**Validation:**
- Validate on blur (not on every keystroke)
- Show errors inline below the field
- Green checkmark for valid fields (optional, not required)
- Error messages are specific: "File must be under 500MB" not "Invalid file"

**Layout:**
- Single column forms (no side-by-side fields except related pairs like city/state)
- Labels above inputs (not inline)
- Required fields marked with subtle asterisk
- Submit button at bottom, full width on mobile

**Auto-save:**
- Admin forms auto-save drafts
- Participant uploads do NOT auto-submit (explicit action required)

## Navigation Patterns

**Admin (Jeb):**
- Sidebar navigation (256px, collapsible on mobile)
- Breadcrumbs for deep navigation (Contest > Category > Submission)
- Tabs for related views (Contest Details, Codes, Judges, Submissions)

**Judge (Marcus):**
- Minimal navigation — focus on the task
- Progress indicator always visible
- Back/Next for sequential review
- No sidebar (distraction-free)

**Participant (Sofia):**
- Step indicator for multi-step flow
- Clear "back" option without losing progress
- No navigation menu (single-purpose flow)

## Empty States

| Context | Message | Action |
|---------|---------|--------|
| No contests | "No contests yet" | "Create your first contest" button |
| No submissions | "No submissions in this category" | Show deadline reminder |
| No assigned reviews | "All caught up!" | Celebrate completion |
| No codes generated | "Codes generate when you publish" | Explain next step |

**Rules:**
- Empty states always explain why it's empty
- Include a primary action when applicable
- Use illustrations sparingly (only if brand includes them)

## Loading States

| Context | Pattern |
|---------|---------|
| Page load | Skeleton (content shapes) |
| Button action | Spinner inside button, button disabled |
| Upload | Progress bar with percentage |
| Data fetch | Skeleton for content area only |

**Rules:**
- Skeletons for content (tables, cards, text)
- Spinners for actions (buttons, submissions)
- Never block the entire screen unless absolutely necessary
- Show progress for anything > 2 seconds

## Status Badge Patterns

| Status | Color | Context |
|--------|-------|---------|
| Draft | Gray | Contest not yet published |
| Published | Blue | Contest accepting submissions |
| Closed | Amber | Submissions closed, judging active |
| Reviewed | Purple | Judging complete, pending finalization |
| Finished | Green | Results published |
| Used | Gray | Participant code has been used |
| Unused | Subtle border only | Participant code available |

**Rules:**
- Badges include text label (not color alone)
- Consistent across all contexts (cards, tables, details)
