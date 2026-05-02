# Research: Group Member/Admin Management Refactor

**Phase**: Phase 0  
**Date**: May 2, 2026  
**Status**: Complete

## Research Findings

### 1. Debouncing & Search Performance

**Decision**: 250ms debounce with 2+ character minimum on frontend  
**Rationale**:

- 250ms matches typical user typing speed, prevents excessive queries
- 2+ character minimum reduces search space significantly
- Frontend debounce is cheaper than server-side rate limiting
- Typical user tests show no perceptible lag at this threshold

**Alternatives Considered**:

- Server-side debouncing (slower, adds latency)
- Optimistic search results (inaccurate, causes confusion)
- No debounce (100+ queries/minute, poor UX)

**Implementation**: Use `useEffect` with `setTimeout` in custom hook; clear on cleanup

---

### 2. Email Invite Flow

**Decision**: Merge invite functionality into single `GroupMember` collection  
**Rationale**:

- Simpler schema: Single collection handles both accepted members and pending invites
- Audit trail preserved: status lifecycle (invited → accepted/declined/cancelled/removed)
- userId nullable for email-only invites; email nullable for confirmed users
- Supports bulk invites without user pre-registration
- Enables invite expiration/resend features in future

**Alternatives Considered**:

- Separate invite collection (rejected: added complexity for minimal benefit)
- Store only email, look up user on display (rejected: loses audit trail, slow)
- Pre-create users on invite (rejected: violates user autonomy, generates spam)

**Implementation**: Single GroupMember collection with userId/email/status fields

---

### 3. Delete Behavior: Create vs Edit Mode

**Decision**: Local-only delete in create; API call with status='removed' in edit  
**Rationale**:

- Create mode: No need to hit server; changes not persisted until form submit
- Edit mode: Member relationship already exists; must be tracked (audit, restore option)
- Status='removed' allows future invite reactivation without losing history

**Alternatives Considered**:

- Always delete from server (loses history, prevents restore)
- Never delete, only hide (confuses future additions of same user)
- Separate "revoke" status (overcomplicates for rare use case)

**Implementation**: Check `groupId` existence; branch logic in delete handler

---

### 4. Role Assignment

**Decision**: Single enum field (admin | member) set at invitation/addition time  
**Rationale**:

- Simple two-state model matches current UI
- Enum validation prevents invalid values
- Matches existing `GroupMember.role` pattern

**Alternatives Considered**:

- Permission-based roles (over-engineered for 2 roles)
- Separate is_admin boolean (less type-safe)

**Implementation**: Keep `role` on `GroupMember`; no separate invite model needed

---

### 5. Search Matching Strategy

**Decision**: Partial name match OR exact email match  
**Rationale**:

- Partial name: Intuitive for users typing "John" to find "John Smith"
- Exact email: Prevents false matches; users expect exact email lookup
- Combined approach gives best UX without false positives

**Alternatives Considered**:

- Partial email match (too many false results, e.g., "com" matches hundreds)
- Fuzzy matching on both (slower, requires additional library)
- Only exact matches (frustrating, too restrictive)

**Implementation**: Query with `{ name: /jo/i, $or: { email: "john@..." } }`

---

### 6. Frontend State Management

**Decision**: Local React state for form members; TanStack Query for search cache  
**Rationale**:

- Form members: Transient until submit; local state avoids unnecessary syncs
- Search results: Reused across sessions; Query caching efficient
- TanStack Query provides automatic debounce, retry, stale-while-revalidate

**Alternatives Considered**:

- Zustand store for all state (overkill for single form)
- Redux (too much boilerplate)
- LocalStorage (persists unwanted changes)

**Implementation**: `useState` for form; `useQuery` for search with 250ms debounce hook wrapper

---

### 7. Backward Compatibility

**Decision**: Add lifecycle fields to `GroupMember`; backfill existing rows as `accepted`  
**Rationale**:

- Existing records don't break; new fields can be added incrementally
- Migration backfills status='accepted' for all current members
- No schema changes to Group document

**Alternatives Considered**:

- Full schema rewrite (risky, high downtime)
- Separate status table (normalized but complex)

**Implementation**: Backfill script; migrations handled in deploy script

---

### 8. Email Validation

**Decision**: Simple regex check on frontend; full validation on backend  
**Rationale**:

- Frontend regex fast, prevents invalid format reaching server
- Backend re-validates (defense in depth)
- Existing project validates emails similarly

**Alternatives Considered**:

- No frontend validation (slow UX)
- Deep SMTP validation (expensive, unnecessary for this feature)

**Implementation**: Reuse existing email validation utility; add in memberSearchService

---

### 9. Optimistic UI Updates

**Decision**: Update cache immediately; revert on error  
**Rationale**:

- Users perceive instant response
- Network latency hidden
- TanStack Query handles reversion automatically

**Alternatives Considered**:

- Wait for server response (slow, poor UX)
- No revert on error (corrupts cache state)

**Implementation**: Use TanStack Query `onMutate` + `onError` callbacks

---

## Open Questions Resolved

✅ All questions from user requirements have been clarified:

- Debounce timing: 250ms
- Minimum characters: 2
- Search matching: Partial name OR exact email
- Delete behavior: Different for create vs edit
- Invite status tracking: invited → accepted/declined/cancelled/removed
- Email validation: Before showing invite option
- Optimistic updates: TanStack Query pattern
- Soft deletes: status='removed' preserves record
