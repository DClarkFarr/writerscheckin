# Contract: Group Query Hooks

## Goals

- Keep all frontend group reads inside `web/src/queries/*` wrappers.
- Make cache ownership and query keys explicit via co-located `.key` methods.
- Allow group summary, members, and meetings to load and fail independently.

## Hook Responsibilities

### `useMyGroupsQuery`

- Uses TanStack Query infinite pagination rather than a single `useQuery` call.
- Owns the My Groups query key method.
- Returns a flattened `groups` array plus pagination helpers such as `fetchNextPage`, `hasNextPage`, and `isFetchingNextPage`.
- Accepts optional status filtering and preserves previously loaded pages while loading the next page.

### `useGroupQuery` and `useGroupFormQuery`

- Continue to own summary/detail-summary reads for group view and group edit flows.
- Return non-collection fields only.
- Do not fetch or normalize member arrays.

### `useGroupMembersQuery`

- Owns the members query key method for a single group.
- Starts as soon as a group detail context is opened and `groupId` is available.
- Fetches one 20-row batch at a time and returns a flattened member list, `fetchNextPage`, `hasNextPage`, and loading/error state specific to the members collection.
- Leaves already loaded member rows intact when a later page fails.

### `useGroupMeetingsQuery`

- Mirrors the members query behavior for meetings.
- Starts in parallel with the summary query and members query once `groupId` is known.
- Returns meetings in newest-to-oldest order with append-only loading semantics.

## Parallel Detail Loading Rule

On group view, group edit, and group summary modal surfaces:

1. Start the summary query as soon as `groupId` is available.
2. Start the members query at the same time.
3. Start the meetings query at the same time.
4. Render each section from its own loading and error state rather than blocking the whole screen on one collection.

## UI Contract

- My Groups uses infinite scrolling to request subsequent group pages.
- Members use an explicit Load More button below the members list.
- Meetings use an explicit Load More Meetings button below the meetings list.
- Empty and error states are section-scoped.
