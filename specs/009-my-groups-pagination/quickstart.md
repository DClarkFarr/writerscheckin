# Quickstart: My Groups Pagination

## Implementation Order

1. Standardize backend group summary responses.
   - Remove embedded members from `/groups/:groupId` response shaping.
   - Keep summary counts on `/groups/mine` and `/groups/:groupId`.

2. Add paginated read contracts for members and meetings.
   - Add or update model helpers for per-group members pagination and meeting pagination.
   - Expose `GET /groups/:groupId/members` and finish `GET /groups/:groupId/meetings` with `rows + nextCursor` responses.
   - Use cursor semantics for meetings based on `occursAt` with `_id` tie-breaker.
   - Use member ordering for pagination: role (`owner`, `admin`, `member`), then `name` (fallback `email`) alphabetically, then `_id`.

3. Update frontend API and query wrappers.
   - Extend `web/src/api/types/groups.ts` with paginated members/meetings response types.
   - Convert `useMyGroupsQuery` to `useInfiniteQuery`.
   - Add `useGroupMembersQuery` and `useGroupMeetingsQuery` wrappers.

4. Refactor UI surfaces.
   - Update My Groups to append pages on scroll.
   - Update group view, group edit, and summary modal to load summary, members, and meetings in parallel.
   - Add section-scoped load-more controls and empty/error states.
   - Enforce role-based meetings visibility: members see published-only meetings; owners/admins see all non-deleted meetings.

5. Validate.
   - `cd express && npm run build`
   - `cd express && npm run check:model-imports`
   - `cd web && npm run build`
   - `cd web && npm run lint`

## Manual Verification

1. Open My Groups with more than 20 groups and confirm scrolling appends additional groups.
2. Confirm My Groups network responses include counts but no `members` array.
3. Open a group view or edit page and confirm summary, members, and meetings begin loading together.
4. Click Load More in members and confirm the list grows by 20 without resetting.
5. Click Load More Meetings and confirm older meetings append after newer ones.
6. Trigger an error on a later page fetch and confirm previously loaded rows remain visible.
7. Verify member ordering stays stable across pages: owner/admin/member grouping, alphabetical name/email order, deterministic tie-break by `_id`.
8. Verify members cannot see draft meetings, while admins/owners can.

## Implementation Notes

- `GET /groups/:groupId` now returns detail-summary fields without embedded `members` arrays.
- `GET /groups/:groupId/members` returns paginated `rows + nextCursor` with deterministic role/name/id ordering.
- `GET /groups/:groupId/meetings` returns paginated `rows + nextCursor` using `occursAt` and `_id` cursor semantics, with role-based visibility filtering.
- My Groups now uses infinite scrolling with a cursor-backed `useInfiniteQuery` wrapper and append-only list behavior.
- Group summary modal, group view, and group edit start summary, members, and meetings queries in parallel and support section-scoped load-more controls.

## Validation Results

- `cd express && npm run build` passed.
- `cd express && npm run check:model-imports` failed due missing script target `express/scripts/check-model-imports.ts` in the current workspace setup.
- `cd web && npm run build` failed on pre-existing unrelated TypeScript errors in `src/components/forms/GroupMemberListItem.tsx`, `src/components/helpers/Portal.tsx`, `src/components/ui/ColorPaletteDropdown.tsx`, and `src/components/ui/spinner.tsx`.
- `cd web && npm run lint` reports pre-existing `react-refresh/only-export-components` violations in shared UI/route files outside this feature scope.
- Lint on feature-touched frontend files passed via targeted ESLint run.
