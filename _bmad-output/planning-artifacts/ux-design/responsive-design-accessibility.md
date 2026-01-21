# Responsive Design & Accessibility

## Responsive Strategy

**Approach:** Desktop-first, responsive adaptation

| Device | Priority | Notes |
|--------|----------|-------|
| Desktop/Laptop | Primary | All users (Admin, Judge, Participant) work primarily here |
| Tablet | Secondary | Occasional judge review, admin monitoring |
| Mobile | Tertiary | Participant uploads (CapCut users), quick status checks |

**Same Interface Philosophy:**
- No separate mobile app or mobile-specific layouts
- Same components, fluidly adapted
- Touch-friendly by default (44px targets)
- Responsive, not redesigned

## Breakpoint Strategy

**Tailwind configuration with MacBook Pro 13" optimization:**

| Breakpoint | Width | Target Device | Layout Behavior |
|------------|-------|---------------|-----------------|
| `sm` | 640px+ | Large phones | Single column, stacked |
| `md` | 768px+ | Tablets | Two-column options |
| `lg` | 1024px+ | Small laptops | Sidebar visible |
| `xl` | 1280px+ | Standard desktops | Full desktop layout |
| `2xl` | 1440px+ | **MacBook Pro 13"** | Optimized primary layout |

**Tailwind Config:**
```js
// tailwind.config.js
theme: {
  screens: {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1440px',  // MacBook Pro 13" - primary target
  }
}
```

**1440px (MacBook Pro 13") Optimization:**
- This is the "golden ratio" layout — perfect first
- Dashboard cards sized optimally for this width
- Tables show all important columns without horizontal scroll
- Sidebar (256px) + content area balanced at this exact width
- Most clients and reviewers will see the product at this resolution

**Key Adaptations:**

| Component | Desktop (lg+) | Mobile (< lg) |
|-----------|---------------|---------------|
| Admin sidebar | Fixed 256px | Hamburger menu / sheet |
| Tables | Full columns | Horizontal scroll or card view |
| Forms | Max-width 600px | Full width, stacked |
| Media viewer | Fullscreen overlay | Fullscreen native |
| Buttons | Inline grouping | Full width, stacked |

## Accessibility Strategy

**Target:** WCAG 2.1 Level AA

| Requirement | Implementation |
|-------------|---------------|
| **Color contrast** | 4.5:1 minimum (body text), 3:1 (large text) |
| **Keyboard navigation** | All interactive elements focusable, logical tab order |
| **Focus indicators** | Visible focus ring on all interactive elements |
| **Screen readers** | Semantic HTML, ARIA labels where needed |
| **Touch targets** | Minimum 44x44px |
| **Reduced motion** | Respect `prefers-reduced-motion` |
| **Text resizing** | Usable up to 200% zoom |

**Role-Specific Considerations:**

| User | Accessibility Notes |
|------|---------------------|
| Jeb (Admin) | Power user, keyboard proficient — ensure shortcuts work |
| Judges | Potentially older users — ensure good contrast, readable text |
| Participants | Teens with varying abilities — ensure upload flow is screen-reader friendly |

## Testing Strategy

**Responsive Testing:**
- Chrome DevTools device simulation for layout verification
- Real device testing: iPhone, Android phone, iPad
- **MacBook Pro 13" (1440px) as primary QA device**
- Browser testing: Chrome, Safari, Firefox, Edge

**Accessibility Testing:**
- Automated: axe DevTools, Lighthouse accessibility audit
- Manual: Keyboard-only navigation testing
- Screen reader: VoiceOver (Mac/iOS), NVDA (Windows)
- Color: Contrast checker, colorblind simulation

**Acceptance Criteria:**
- Lighthouse accessibility score ≥ 90
- Zero critical axe violations
- Complete keyboard navigation possible
- All form fields have associated labels

## Implementation Guidelines

**Responsive Development:**
- Use Tailwind responsive prefixes consistently
- Mobile styles as default, enhance with `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Use `rem` and `%` over fixed `px` where appropriate
- Test touch targets on actual devices
- Ensure forms are usable on mobile keyboards

**Accessibility Development:**
- Semantic HTML: `<main>`, `<nav>`, `<section>`, `<article>`, `<button>`
- Headings: Logical hierarchy (h1 → h2 → h3), never skip levels
- Images: Alt text for informational images, empty alt for decorative
- Forms: `<label>` associated with every input, error messages linked via `aria-describedby`
- Focus: Never remove focus outlines, customize with visible styles
- Dynamic content: `aria-live` regions for toasts and status updates

---

*UX Design Specification Complete — 2026-01-09*
