# Quickstart: My Meetings Tab

## Implementation Order

1. Standardize backend meeting DTO shaping.

- Add/adjust service-level mapper returning `MyMeetingFeedItem` for every row.
- Ensure all feed rows include consistent fields (`segment`, `isDraft`, `isAdminOnly`, counts, check-in state, display tone).

2. Implement role-based meeting feed retrieval.

- Members: next upcoming published meeting per group, then published past meetings.
- Admins/owners: include upcoming drafts plus required admin-only badge flags.
- Keep deterministic segment-aware sorting and cursor pagination.

3. Add check-in mutation endpoint behavior.

- Accept `attending`, `reading`, `not_attending`.
- Return canonical updated counts and state to support optimistic reconciliation.

4. Wire frontend API contracts and query wrappers.

- Add typed API models in `web/src/api/types/groups.ts`.
- Implement `useMyMeetingsQuery` (`useInfiniteQuery`) with deduped append behavior.
- Implement `useMeetingCheckinMutation` with optimistic update + rollback.

5. Build drawer-based check-in UX.

- Add `MeetingCheckinDrawer` with three action choices.
- Trigger from row action button (`check in` / `update check-in`).
- Keep row badge/button styles synchronized with optimistic and confirmed state.

6. Apply My Meetings feed UI rules.

- Upcoming rows blue by default; red when upcoming row is marked not attending; past rows gray.
- Display date bookend, meeting name, attendance counts, reading counts, and user status badges.
- Render `admin only` badge with hidden-eye icon for admin draft rows.

7. Validate and regression-check.

- Ensure infinite scroll appends pages without duplicates.
- Verify rollback on check-in failure preserves pre-mutation state.
- Confirm member vs admin visibility behavior.

## Manual Verification

1. Sign in as a member and confirm upcoming list shows only next published upcoming meeting per group.
2. Confirm member account never sees draft meetings.
3. Sign in as admin and confirm upcoming draft meetings appear with `admin only` hidden-eye badge.
4. Scroll through multiple pages and verify ordering remains upcoming first, then past.
5. Open check-in drawer and submit each option; verify optimistic badge/button updates.
6. Simulate a failed check-in request and verify rollback to previous state.
7. Confirm counts and status reconcile to server values after successful mutation.

## Validation Commands

- `cd express && npm run build`
- `cd web && npm run build`
- `cd web && npm run lint`

## Final Verification Notes

- Backend validation: `cd express && npm run build` passes.
- Frontend build currently fails due pre-existing unrelated type issues in:
  - `src/components/forms/GroupMemberListItem.tsx`
  - `src/components/helpers/Portal.tsx`
  - `src/components/ui/ColorPaletteDropdown.tsx`
  - `src/components/ui/spinner.tsx`
- Frontend lint currently fails due pre-existing `react-refresh/only-export-components` violations in shared UI and route files.
- My Meetings-specific changes compile cleanly in touched files and include:
  - Infinite scroll sentinel with bottom-of-list loading trigger.
  - End-of-feed terminal state rendering.
  - Append-order de-duplication by `meetingId` in infinite query flattening.
  - Segment-aware cursor continuation key handling in backend feed filtering.
