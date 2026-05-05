# Quickstart: Meetings Mine Aggregation Alignment

## Implementation order

1. Move the aggregation execution boundary into model-owned helpers and fix cursor filtering to use `occursAt` consistently.
2. Extend the paginated aggregation to attach current-user `attendance` after cursor filtering.
3. Add `populateMeetingsWithCounts()` so paginated rows are enriched with `counts` before final serialization.
4. Update `memberMeetingAggregationRowToResponse` to preserve `membership`, `attendance`, and `counts` while normalizing meeting document fields.
5. Rename shared API types from `MyMeetingFeedItem` to `MemberMeetingFeedItem` and change the list response to use `rows`.
6. Remove frontend normalization logic that invents legacy derived fields.
7. Update the my meetings query, optimistic check-in mutation, card, drawer, and tab components to use nested `attendance` and `counts` plus derived selectors.
8. Extract any repeated derived-state logic into a shared hook or selector helper.

## Verification checklist

1. `GET /groups/meetings/mine` returns `rows` with `membership`, `attendance`, and `counts`.
2. Cursor pagination still advances correctly when multiple meetings share the same `occursAt`.
3. Meetings with no attendee row for the current user return `attendance: null`.
4. Meetings with no attending or reading rows return `counts: { attending: 0, reading: 0 }`.
5. The React my meetings tab renders without relying on server-provided `segment`, `isAdminOnly`, `showAdminOnlyBadge`, or `canCheckin`.
6. Optimistic check-in updates adjust the nested attendance status and count object correctly.

## Suggested validation commands

```bash
cd express && npm run build
cd web && npm run lint
cd web && npm run build
cd web && npx tsc --noEmit
```

## Manual checks

1. Open the my meetings tab as a member with mixed upcoming and past meetings.
2. Confirm draft meetings shown to admins display the intended badge purely from derived state.
3. Update attendance from the drawer and confirm the card reflects the optimistic state immediately.
4. Scroll through multiple pages and confirm meeting ordering and deduplication remain stable.

## Implementation status

- Completed: setup phase, foundational backend/API refactor, User Story 1, User Story 2, and User Story 3 fallback hardening.
- Implemented backend changes:
  - meetings/mine aggregation execution moved into `express/src/models/groupMeetings.ts`
  - current-member attendee lookup added in `express/src/models/meetingAttendees.ts`
  - counts hydration orchestrated in `express/src/services/groupMeetingsService.ts`
- Implemented frontend changes:
  - `MemberMeetingFeedItem` contract introduced in `web/src/api/types/groups.ts`
  - `rows`-based normalization added in `web/src/api/groups.ts`
  - derived state centralized in `web/src/hooks/useMemberMeetingDerivedState.ts`
  - My Meetings query, card, drawer, tab, and optimistic mutation updated to use nested `attendance` and `counts`

## Validation results

- Passed: `cd express && npm run build`
- Passed: `cd web && npx tsc --noEmit`
- Fails due unrelated pre-existing issues outside this feature: `cd web && npm run build`
- Fails due unrelated pre-existing issues outside this feature: `cd web && npm run lint`
