# Design System Foundation

## Design System Choice

**Primary:** shadcn/ui + Tailwind CSS
**Typography:** Inter
**Mode:** Light only

This combination provides:
- Linear/Untitled UI/Stripe-level polish out of the box
- Full ownership of component code (copy into project, not npm dependency)
- Tailwind's utility-first approach for consistent spacing and styling
- Accessible, keyboard-navigable components by default

## Rationale for Selection

| Requirement | How shadcn/ui + Tailwind Delivers |
|-------------|----------------------------------|
| Modern, sleek aesthetic | Matches Linear/Untitled UI visual language exactly |
| Inter typeface | Default font, no configuration needed |
| Component consistency | Pre-built, tested components with unified API |
| React + Vite stack | Native integration, no adapters needed |
| Customization control | Own the code, modify freely, no vendor lock-in |

## Implementation Approach

**Component Library Discipline (CRITICAL)**

Every UI element MUST use shared components from the design system. No exceptions.

| Rule | Rationale |
|------|-----------|
| All buttons use `<Button>` component | Update once, propagate everywhere |
| All inputs use `<Input>` component | Consistent validation, focus states, sizing |
| All cards use `<Card>` component | Unified shadows, borders, padding |
| No inline Tailwind for component-level styling | Prevents visual drift and inconsistency |
| New patterns go into component library first | Then used across the app |

**Folder Structure:**
```
src/
  components/
    ui/           # shadcn/ui base components (Button, Input, Card, etc.)
    composed/     # App-specific composed components (SubmissionCard, RatingScale, etc.)
```

**Enforcement:**
- Code reviews must verify component library usage
- No raw `<button>` or `<input>` elements in feature code
- Tailwind utilities allowed for layout (flex, grid, spacing) but not for component styling

## Customization Strategy

**Design Tokens (via Tailwind config):**
- Colors: Primary, secondary, success, warning, error, neutral scale
- Spacing: Consistent 4px base unit
- Border radius: Subtle, consistent across components
- Shadows: Minimal, purposeful (not decorative)

**Component Variants:**
- Button: primary, secondary, ghost, destructive
- Badge: status colors mapped to contest/submission states
- Progress: Linear style for judge review progress

**Custom Components (to build):**
- `<UploadProgress>` — Stripe-quality upload experience
- `<RatingScale>` — 5-tier judge rating with visual feedback
- `<SubmissionCard>` — Anonymous submission display for judges
- `<ContestStatusBadge>` — Draft/Published/Closed/Reviewed/Finished states
