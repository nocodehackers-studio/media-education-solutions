# Sprint Change Proposal

**Date:** 2026-01-21
**Project:** Media Education Solutions
**Requested By:** Client (NocodeHackers)
**Facilitated By:** Bob (Scrum Master Agent)
**Status:** Pending Approval

---

## Section 1: Issue Summary

### Problem Statement

The client has requested three significant changes to the data model and application structure between Epic 2 completion and Epic 3 start:

1. **Institution Code Model:** Participant codes should represent institutions (schools), not individual participants. Multiple groups from the same institution can submit using the same code, with participant/group information captured per submission rather than per code.

2. **Flexible Judge Assignment:** Judges should be assignable at any point in the category lifecycle, not required at category creation. Categories can be published and closed without a judge assigned.

3. **Divisions Concept:** A new hierarchical layer between Contest and Category. Divisions allow organizing categories by competition level (e.g., High School, Teen, Teachers). Each division can have its own set of categories with independent rules and deadlines.

### Discovery Context

- **When:** Between Epic 2 completion and Epic 3 start
- **How:** Client conversation clarifying real-world use case
- **Trigger:** Client needs to run contests for multiple schools simultaneously, with divisions for different competition levels

### Evidence

- Client described use case: "Schools receive codes, multiple groups per school submit"
- Client example: "Nature Education Contest with High School, Teen, and Teachers divisions"
- Current model assumes 1 code = 1 participant, which doesn't fit client's needs

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact Level | Description |
|------|--------------|-------------|
| Epic 2 (Done) | MODERATE | Story 2-6 UI changes + New Story 2.9 for Divisions |
| Epic 3 | LOW | Judge assignment becomes optional |
| Epic 4 | HIGH | Division selection + new submission form fields |
| Epic 5 | HIGH | Division-aware judging |
| Epic 6 | MODERATE | Division filtering in admin views |
| Epic 7 | LOW | No structural changes |

### Artifact Conflicts

| Artifact | Conflict Level | Changes Required |
|----------|----------------|------------------|
| PRD | MODERATE | FR15-16 (code generation), FR26-28 (submission info), NEW FR14a-h (divisions) |
| Architecture | HIGH | New divisions table, modified participants/categories/submissions tables |
| Epic 2 | MODERATE | Story 2-6 modification + New Story 2.9 |
| Epic 3 | LOW | Story 3.1 modification (optional judge) |
| Epic 4 | HIGH | Story 4.1, 4.2 modifications |
| Epic 5 | HIGH | Story 5.1 modifications (division context) |
| Epic 6 | MODERATE | Story 6.1, 6.5 modifications |

### Database Schema Changes

**New Table:**
- `divisions` - Grouping layer between contests and categories

**Modified Tables:**
- `participants` - Remove name/tlc fields, keep organization_name
- `categories` - Change contest_id to division_id
- `submissions` - Add group_name, participant_names, tlc_name, tlc_email

---

## Section 3: Recommended Approach

### Selected Path: Direct Adjustment

**Rationale:**
- Epic 2 foundation is solid (auth, contest CRUD, category CRUD)
- Changes are additive (divisions) or modifications (form fields)
- No rollback needed - extend and modify existing work
- Client requirements are clear and well-understood

**Effort Estimate:** Medium-High
**Risk Level:** Medium
**Timeline Impact:** Adds ~1 story to Epic 2, modifications to Epic 3-6 stories

### Why Not Other Options?

- **Rollback:** Not needed - existing code provides solid foundation
- **MVP Reduction:** Not viable - divisions are core to client's use case

---

## Section 4: Detailed Change Proposals

### Change #1: Institution Code Model (7 Proposals)

| # | Proposal | Artifact |
|---|----------|----------|
| 1.1 | Remove name/tlc fields from participants table | Architecture |
| 1.2 | Add group_name, participant_names, tlc fields to submissions table | Architecture |
| 1.3 | Change code generation from batch (50) to single with organization name | Story 2-6 |
| 1.4 | Update code list display to show organization name | Story 2-6 |
| 1.5 | Restructure submission form (group info per submission) | Epic 4 Story 4.2 |
| 1.6 | Update FR15-16, FR26-28 | PRD |
| 1.7 | Update database schema documentation | Architecture |

**Schema Changes:**

```sql
-- Participants (organization codes)
participants (
  id UUID PRIMARY KEY,
  contest_id UUID REFERENCES contests(id),
  code TEXT NOT NULL,
  status TEXT DEFAULT 'unused',
  organization_name TEXT,  -- Admin enters when generating
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contest_id, code)
)

-- Submissions (with group info)
submissions (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  participant_id UUID REFERENCES participants(id),
  group_name TEXT NOT NULL,
  participant_names TEXT NOT NULL,
  tlc_name TEXT,
  tlc_email TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, participant_id)
)
```

### Change #2: Flexible Judge Assignment (3 Proposals)

| # | Proposal | Artifact |
|---|----------|----------|
| 2.1 | Judge assignment optional, can be done at any time | Epic 3 Story 3.1 |
| 2.2 | Mark judge_id as nullable in schema | Architecture |
| 2.3 | Update FR20 to clarify optional assignment | PRD |

**Key Behavior:**
- Categories can be published/closed without judge
- Warning shown but not blocking
- Invitation email only sent when judge exists

### Change #3: Divisions Concept (8 Proposals)

| # | Proposal | Artifact |
|---|----------|----------|
| 3.1 | New divisions table | Architecture |
| 3.2 | Categories reference division_id (not contest_id) | Architecture |
| 3.3 | New FR14a-h for divisions | PRD |
| 3.4 | New Story 2.9: Division Management | Epic 2 |
| 3.5 | Division selection for participants | Epic 4 Story 4.1 |
| 3.6 | Judge division awareness | Epic 5 Story 5.1 |
| 3.7 | Categories managed under divisions | Epic 2 Story 2.5 |
| 3.8 | Admin views with division filtering | Epic 6 |

**Schema Changes:**

```sql
-- Divisions (new table)
divisions (
  id UUID PRIMARY KEY,
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contest_id, name)
)

-- Categories (updated)
categories (
  id UUID PRIMARY KEY,
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,  -- Changed from contest_id
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rules TEXT,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft',
  judge_id UUID REFERENCES profiles(id) NULL,
  invited_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**New PRD Requirements (FR14a-h):**
- FR14a: Every contest must have at least one division
- FR14b: Super Admin can create multiple divisions within a contest
- FR14c: Super Admin can edit division name and display order
- FR14d: Super Admin can delete a division (deletes all categories)
- FR14e: Single division = hidden from participants (seamless)
- FR14f: Multiple divisions = participant must select
- FR14g: Super Admin can duplicate category to another division
- FR14h: Same category name allowed in multiple divisions

---

## Section 5: Implementation Handoff

### Change Scope Classification: MODERATE

This change requires:
- Backlog reorganization (new story, modified stories)
- Database migrations
- UI/UX modifications across multiple epics

### Handoff Recipients

| Role | Responsibility |
|------|----------------|
| **PM/Architect** | Review and approve schema changes |
| **Scrum Master** | Update sprint-status.yaml, create Story 2.9 |
| **Dev Team** | Implement database migrations and code changes |

### Implementation Sequence

1. **Phase 1: Database Migration (Story 2.9 prerequisite)**
   - Create divisions table
   - Modify categories table (division_id)
   - Modify participants table (remove fields)
   - Modify submissions table (add fields)
   - Create default division for existing contests

2. **Phase 2: Story 2.9 - Division Management**
   - Division CRUD in admin UI
   - Default division on contest creation
   - Duplicate category feature

3. **Phase 3: Story 2-6 Modifications**
   - Single code generation with organization name
   - Updated code list display

4. **Phase 4: Continue with Epic 3+**
   - Epic 3: Optional judge assignment
   - Epic 4: Division selection + new submission form
   - Epic 5: Division-aware judging
   - Epic 6: Division filtering in admin views

### Success Criteria

- [ ] All database migrations applied successfully
- [ ] Existing contests have default division created
- [ ] Admin can create/manage divisions
- [ ] Admin can generate codes with organization name
- [ ] Participants see division selection (when multiple)
- [ ] Submission form captures group/TLC info
- [ ] Judges see division context
- [ ] All existing tests pass (with updates)
- [ ] New tests cover division functionality

---

## Appendix: Approved Proposals Summary

| Change | # | Proposal | Status |
|--------|---|----------|--------|
| 1 | 1.1 | DB: Participants table - remove name/tlc fields | ✅ Approved |
| 1 | 1.2 | DB: Submissions table - add group/tlc fields | ✅ Approved |
| 1 | 1.3 | Story 2-6: Single code generation | ✅ Approved |
| 1 | 1.4 | Story 2-6: Code list with organization name | ✅ Approved |
| 1 | 1.5 | Epic 4 Story 4.2: Submission form restructure | ✅ Approved |
| 1 | 1.6 | PRD: Update FR15-16, FR26-28 | ✅ Approved |
| 1 | 1.7 | Architecture: Update schema docs | ✅ Approved |
| 2 | 2.1 | Epic 3 Story 3.1: Optional judge | ✅ Approved |
| 2 | 2.2 | Architecture: Nullable judge_id | ✅ Approved |
| 2 | 2.3 | PRD: Update FR20 | ✅ Approved |
| 3 | 3.1 | DB: New divisions table | ✅ Approved |
| 3 | 3.2 | DB: Categories reference division_id | ✅ Approved |
| 3 | 3.3 | PRD: New FR14a-h for divisions | ✅ Approved |
| 3 | 3.4 | Epic 2: New Story 2.9 Division Management | ✅ Approved |
| 3 | 3.5 | Epic 4 Story 4.1: Division selection | ✅ Approved |
| 3 | 3.6 | Epic 5: Judge division awareness | ✅ Approved |
| 3 | 3.7 | Epic 2 Story 2.5: Categories under divisions | ✅ Approved |
| 3 | 3.8 | Epic 6: Division filtering in admin views | ✅ Approved |

**Total: 18 approved proposals**

---

## Approval

**Do you approve this Sprint Change Proposal for implementation?**

- [ ] **Approved** - Proceed with implementation
- [ ] **Approved with conditions** - (specify conditions)
- [ ] **Revise** - (specify what needs revision)
- [ ] **Rejected** - (specify reason)

**Approver:** _______________
**Date:** _______________
