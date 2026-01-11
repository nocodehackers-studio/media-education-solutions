# Visual Design Foundation

## Design Aesthetic

**Premium European Design Language**

The visual identity draws from Scandinavian/Swiss design principles:
- Restraint as luxury — every element earns its place
- Whitespace as a design element, not empty space
- Typography-forward hierarchy
- Color used sparingly and purposefully
- Quiet confidence over flashy decoration

## Color System

**Foundation:** Untitled UI color palette

**Neutral Scale (Primary UI Colors):**
| Token | Usage |
|-------|-------|
| Gray-50 | Page backgrounds |
| Gray-100 | Card backgrounds, subtle borders |
| Gray-200 | Dividers, disabled states |
| Gray-300 | Borders |
| Gray-400 | Placeholder text |
| Gray-500 | Secondary text |
| Gray-600 | Body text |
| Gray-700 | Headings |
| Gray-900 | Primary text, high contrast |

**Brand/Primary Color:**
- Untitled UI primary (clean blue or neutral accent)
- Used sparingly: primary buttons, active states, key actions
- Not splashed everywhere — reserved for what matters

**Semantic Colors:**
| Token | Color | Usage |
|-------|-------|-------|
| Success | Green | Confirmations, completed states, "Submitted successfully" |
| Warning | Amber | Deadlines approaching, grace period countdown |
| Error | Red | Failed uploads, validation errors |
| Info | Blue | Informational messages, tips |

**Status Badge Colors (Contest/Submission States):**
| Status | Color Treatment |
|--------|----------------|
| Draft | Gray, muted |
| Published | Blue, active |
| Closed | Amber, attention |
| Reviewed | Purple, progress |
| Finished | Green, complete |

## Typography System

**Typeface:** Inter

**Type Scale:**
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 36-48px | 600 | Hero headings (rare) |
| H1 | 30px | 600 | Page titles |
| H2 | 24px | 600 | Section headings |
| H3 | 20px | 500 | Card titles, subsections |
| H4 | 16px | 500 | Labels, small headings |
| Body | 16px | 400 | Primary content |
| Body Small | 14px | 400 | Secondary content, metadata |
| Caption | 12px | 400 | Timestamps, hints, labels |

**Line Heights:**
- Headings: 1.2-1.3 (tight)
- Body: 1.5-1.6 (comfortable reading)

**Letter Spacing:**
- Headings: -0.02em (slightly tighter)
- Body: Normal
- All caps labels: +0.05em (slightly looser)

## Spacing & Layout Foundation

**Base Unit:** 4px (Tailwind default)

**Spacing Scale:**
| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight element spacing |
| sm | 8px | Related element groups |
| md | 16px | Component internal padding |
| lg | 24px | Section spacing |
| xl | 32px | Major section breaks |
| 2xl | 48px | Page section separation |

**Role-Based Density:**

| Role | Density | Rationale |
|------|---------|-----------|
| **Admin (Jeb)** | Higher density | Needs to scan lots of data quickly; comfortable with information-rich views |
| **Judges** | Medium-low density | Focus on one submission at a time; reduce cognitive load |
| **Participants** | Low density | Generous spacing builds confidence; reduces anxiety during upload |

**Layout Principles:**
- Max content width: 1280px (centered on large screens)
- Sidebar navigation: 256px fixed width
- Card padding: 24px standard
- Form field spacing: 16px between fields
- Button spacing: 12px between grouped buttons

## Accessibility Considerations

**Contrast Ratios:**
- Body text on backgrounds: Minimum 4.5:1 (WCAG AA)
- Large text (18px+): Minimum 3:1
- Interactive elements: Clear focus states with visible outlines

**Touch Targets:**
- Minimum 44x44px for interactive elements
- Generous click/tap areas on mobile

**Color Independence:**
- Never rely on color alone to convey meaning
- Status badges include text labels, not just color
- Error states include icons + text, not just red color

**Reduced Motion:**
- Respect `prefers-reduced-motion` system setting
- Animations are subtle and purposeful, not decorative
- No auto-playing animations or videos
