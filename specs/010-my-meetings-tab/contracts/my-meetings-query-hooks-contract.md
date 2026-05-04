# Contract: My Meetings Query Hooks

## Goals

- Keep all My Meetings reads and check-in writes in `web/src/queries/*` wrappers.
- Standardize query keys and optimistic update behavior.
- Keep drawer UI presentational while hooks own data logic.

## Hook Responsibilities

### `useMyMeetingsQuery`

- Uses `useInfiniteQuery`.
- Uses `myMeetingsQueryKey()` as the canonical query-key helper.
- Calls `getMyMeetings(...)` from `web/src/api/groups.ts`.
- Flattens `data.pages[].items` to `items` for feed rendering.
- Exposes `fetchNextPage`, `hasNextPage`, and `isFetchingNextPage` for infinite scroll.
- Deduplicates by `meetingId` when flattening pages while preserving append order (first seen item wins).

### `useMeetingCheckinMutation`

- Exports mutation key helper and consumes `useMyMeetingsQuery.key(...)` for cache updates.
- Uses `mutateAsync` as the primary invocation style.
- Implements optimistic updates via TanStack Query lifecycle methods:
  - `onMutate`: snapshot previous page cache; patch matching item with selected state and predicted attendance/reading count deltas.
  - `onError`: rollback to snapshot.
  - `onSettled`: invalidate My Meetings query to reconcile with canonical server state.

### `useMeetingCheckinDrawer`

- Owns drawer open/close state and selected meeting context.
- Provides `openDrawer(meeting)` and `submitChoice(state)` to presentational components.
- Delegates persistence to `useMeetingCheckinMutation`.

## UI Contract

- Clicking `check in` or `update check-in` opens a drawer with exactly three options:
  - `attending`
  - `reading`
  - `not attending`
- Drawer selection triggers optimistic mutation immediately.
- Row badges and button labels reflect optimistic state while request is in flight.
- Admin-only draft rows render an `admin only` badge with hidden-eye icon when `showAdminOnlyBadge=true`.

## Cache Scope Rules

- Optimistic patching is limited to the affected feed item within the active My Meetings cache key.
- No direct component-level API mutation calls are allowed.
- Components consume hook-provided state only.
