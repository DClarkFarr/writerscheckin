# Research: Group Invite Actions

## Decision 1: Reuse `GET /groups/mine` for pending invites

- Decision: Use existing `GET /groups/mine` with `status=invited` for both badge count and invite list rows.
- Rationale: Backend already supports status filtering through `listMyGroupsSummary` and `ensureGroupMemberInviteStatus`, so this avoids duplicate read endpoints and keeps pagination semantics consistent.
- Alternatives considered:
  - Add `GET /groups/invites/mine`: rejected because it duplicates membership read logic and expands maintenance surface.
  - Enrich `GET /groups/mine?status=accepted` with invite payload: rejected because it mixes two datasets with different UX intent.

## Decision 2: Add explicit invite response mutation endpoint

- Decision: Add a user-facing mutation endpoint for pending invites (accept/decline), implemented via service layer and `updateGroupMemberById` status transitions.
- Rationale: Existing backend has transition rules (`invited -> accepted|declined`) but no dedicated self-response route; a focused route keeps authorization and error semantics explicit.
- Alternatives considered:
  - Reuse generic group-member admin endpoints: rejected because current routes are admin-focused and do not expose user self-response semantics.
  - Encode invite response inside group edit payload: rejected as inappropriate coupling to admin group management.

## Decision 3: Optimistic cache + targeted invalidation strategy

- Decision: Use optimistic update with snapshot/rollback for invite accept/decline mutation and invalidate `myGroupQueryKey("invited")`, `myGroupQueryKey("accepted")`, and `myMeetingsQueryKey()` on settle.
- Rationale: Accepting an invite changes both groups tab datasets and meeting eligibility; declining affects invite datasets only but shared settle invalidation keeps canonical state simple and robust.
- Alternatives considered:
  - Invalidate all queries globally: rejected due to unnecessary network churn.
  - Only update local component state without query cache changes: rejected because home tabs and meeting feed must remain cross-view consistent.

## Decision 4: New presentational invite components

- Decision: Introduce `GroupInviteList` (list container) and `GroupInviteListItem` (row-level detail + buttons) under `web/src/components/home/`.
- Rationale: Keeps My Groups tab readable and aligns with constitution guidance separating presentation from state/mutation logic.
- Alternatives considered:
  - Build invite markup inline in `MyGroupsTab`: rejected due to growing complexity and reduced reuse/testability.
  - Single monolithic invite component with embedded query calls: rejected because presentation would leak data-fetching concerns.

## Decision 5: Invite sort behavior

- Decision: Sort pending invites by membership `createdAt` descending (newest first) before rendering.
- Rationale: Requirement specifies created-date ordering; descending makes newest invites immediately visible and matches existing paginated ordering patterns.
- Alternatives considered:
  - Ascending order: rejected as lower-priority invites can hide recent actionable items.
  - Server-only sort without client guard: rejected because deterministic rendering should remain stable even if backend order shifts.
