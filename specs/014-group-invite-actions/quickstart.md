# Quickstart: Group Invite Actions

## Goal

Ship pending invite visibility and response workflow on home page with consistent cache updates across My Groups and My Meetings.

## Implementation Steps

1. Backend invite response route and service

- Add route in `express/src/routers/groupsRouter.ts` for `POST /groups/members/:membershipId/respond`.
- Add service function in `express/src/services/groupMembersService.ts` to validate ownership and apply `invited -> accepted|declined` transition.
- Reuse model transition guard in `updateGroupMemberById`.

2. Frontend API and types

- Add `respondToGroupInvite` API function in `web/src/api/groups.ts`.
- Add response and input types in `web/src/api/types/groups.ts`.

3. Query hooks and optimistic mutation

- Add `useRespondToGroupInviteMutation` in `web/src/queries/`.
- Use `cancelAndSnapshot` and `rollbackSnapshot` from `web/src/queries/optimisticCache.ts`.
- On settle invalidate:
  - `myGroupQueryKey("invited")` to refresh pending invite list and badge
  - `myGroupQueryKey("accepted")` to refresh My Groups current tab cards
  - `myMeetingsQueryKey()` to refresh meeting eligibility after accept/decline

4. Invite read hook and home integration

- Reuse `useMyGroupsQuery({ status: "invited" })` for pending invites.
- Add invite count badge to My Groups tab trigger in `web/src/pages/home.tsx`.
- Ensure badge hides at zero.

5. New components

- Create `web/src/components/home/GroupInviteList.tsx`.
- Create `web/src/components/home/GroupInviteListItem.tsx`.
- Render Group Invites card at top of `MyGroupsTab` before accepted-groups list.
- Include button text/icons per spec:
  - Join Group + checkmark (blue)
  - Decline + X (red)

6. Navigation and sorting

- Sort invite rows by invite created date descending before render.
- On successful accept, navigate to `/groups/$groupId/view`.

## Manual Verification Checklist

1. Invite badge visibility

- Sign in as user with pending invites.
- Confirm My Groups tab shows correct numeric badge.
- Remove all pending invites and confirm badge disappears.

2. Invite list rendering

- Open My Groups tab.
- Confirm Group Invites card appears with invite rows and required fields.
- Confirm Join Group and Decline button text, colors, and icons match requirements.
- Confirm sort order is newest invite first.

3. Accept flow

- Click Join Group on pending invite.
- Confirm optimistic removal from invite list.
- Confirm navigation to group view page.
- Return home and confirm accepted group appears in My Groups list after refresh.
- Confirm My Meetings tab data refreshes to include newly eligible meetings.

4. Decline flow

- Click Decline on pending invite.
- Confirm optimistic removal and no redirect.
- Confirm invite remains absent after settled refetch.
- Confirm no regressions in accepted group list or meetings tab.

5. Failure rollback

- Simulate API failure.
- Confirm optimistic changes rollback and error feedback appears.
