# Future Work

Deferred items and technical debt to address in future sprints.

---

## Security Hardening

### Server-side "Last Division" Guard

**Priority:** Medium
**Source:** Story 2.9 Code Review (2026-01-21)

**Issue:** Division deletion currently relies on client-side validation only. The UI shows an error toast when attempting to delete the only division, but there's no database-level protection. A client bypassing the UI (e.g., direct API call) could delete the last division.

**Current State:**
- `useDeleteDivision` hook checks count before delete (client-side)
- `DivisionListItem` shows error toast for last division (UI-side)
- No DB constraint or RLS rule prevents deletion

**Proposed Fix:** Add a database trigger or check constraint:

```sql
-- Option 1: Trigger function
CREATE OR REPLACE FUNCTION prevent_last_division_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM divisions WHERE contest_id = OLD.contest_id) <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the only division. A contest must have at least one division.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_minimum_division
  BEFORE DELETE ON divisions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_division_delete();
```

**Risk if Unaddressed:** Low - only admins can delete divisions via RLS, and they would need to intentionally bypass the UI.

**Related:** AC5 in Story 2.9
