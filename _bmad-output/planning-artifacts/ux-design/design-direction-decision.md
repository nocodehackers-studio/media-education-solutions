# Design Direction Decision

## Chosen Direction

**Premium European Design** — A singular, cohesive direction established through collaborative discovery.

| Element | Decision |
|---------|----------|
| **Aesthetic** | Scandinavian/Swiss restraint — every element earns its place |
| **Color System** | Untitled UI palette |
| **Typography** | Inter |
| **Components** | shadcn/ui + Tailwind CSS |
| **Inspiration** | Linear, Untitled UI, Stripe |
| **Mode** | Light only |
| **Density** | Role-based (dense for Admin, spacious for Judges/Participants) |

## Design Rationale

No exploratory mockups were needed — the design direction emerged clearly through our conversation:

1. **Inspiration alignment** — Linear, Untitled UI, and Stripe share a common visual language that maps directly to implementation via shadcn/ui
2. **Technical consistency** — shadcn/ui + Tailwind provides the exact aesthetic without custom design work
3. **User-appropriate density** — Role-based spacing addresses the distinct needs of power users (Jeb) vs. occasional users (Judges, Participants)
4. **Simplicity** — Light mode only reduces complexity and maintenance burden

## Implementation Approach

The design direction is immediately implementable:
- Install shadcn/ui components into the React + Vite project
- Configure Tailwind with Untitled UI color tokens
- Apply Inter typeface via Google Fonts or local hosting
- Follow component library discipline (all UI from shared components)

No custom design tokens or component variants needed beyond what shadcn/ui provides.
