# Scoping & Development Strategy

## MVP Philosophy

**Approach:** Problem-Solving MVP

This is a validation MVP focused on proving the platform replaces Jeb's manual process. Success is measured by Jeb's verdict, not metrics dashboards.

**Core Principle:** Ship the smallest thing that solves the problem, then iterate based on real usage feedback.

## MVP Boundaries

**In Scope (Phase 1):**
- Full contest lifecycle (Draft → Published → Closed → Reviewed → Finished)
- Three user roles: Super Admin, Judges, Participants
- Contest creation with categories (video or photo)
- On-demand participant code generation (50 per batch) via "Generate Codes" button
- Code list with Used/Unused status tracking
- Video uploads (up to 500MB) via Bunny Stream
- Photo uploads (up to 10MB) via Bunny Storage
- Anonymous judging (submissions identified by code only)
- 5-tier rating scale with written feedback
- Drag-and-drop top 3 ranking per category
- Winners page with password protection
- Email notifications via Brevo (judge invites, T/L/C notifications)
- Dashboard with submission counts and judge progress

**Explicitly Out of Scope (Post-MVP):**
- PDF generation for contest materials
- Multi-language support
- Multiple judges per category
- Public voting / audience scoring
- Contest duplication / templating
- CSV or advanced data exports
- Analytics dashboards
- AI plagiarism / content analysis
- Payment processing
- Native mobile apps

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Deadline crunch uploads (100+ simultaneous) | High | High | Bunny infrastructure handles load; implement chunked uploads with progress feedback |
| Judge UX confusion | Medium | Medium | Pristine, self-explanatory interface; progress indicators throughout |
| Large file upload failures | Medium | High | Resumable uploads; clear error messaging; retry capability |
| Video transcoding delays | Low | Medium | Bunny Stream handles transcoding; set user expectations on processing time |

## Development Priorities

**Critical Path (Must work for launch):**
1. Contest CRUD and lifecycle management
2. Participant code generation and tracking
3. File upload pipeline (Bunny integration)
4. Judge review workflow
5. Winners page generation

**Important but not blocking:**
- Email notifications (can be added incrementally)
- Dashboard metrics (manual checking acceptable initially)
