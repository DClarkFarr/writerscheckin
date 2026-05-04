# Contract: Meeting Page Routes, Hooks, And Autosave

## Goals

- Keep new meeting pages breadcrumbed and route-scoped.
- Separate read queries from admin edit queries.
- Centralize autosave, publish, and attendance mutations in hooks.

## Route Responsibilities

### `/groups/$groupId/meetings/$meetingId/view`

- Route file is a thin TanStack Router wrapper only.
- Page renders inside `PageCard` with breadcrumb header.
- Breadcrumbs include group-context navigation and a current-page label for the view page.
- Page consumes `useMeetingViewQuery` and existing check-in mutation wrappers.

### `/groups/$groupId/meetings/$meetingId/edit`

- Route file remains a thin wrapper around the page component.
- Page renders inside `PageCard` with breadcrumb header.
- Breadcrumbs include group-context navigation and a current-page label for the edit page.
- Page consumes `useEditableMeetingQuery`, `useMeetingForm`, `useSaveMeetingMutation`, and `usePublishMeetingMutation`.

## Query And Mutation Responsibilities

### `useMeetingViewQuery`

- Uses `useQuery`.
- Exports `useMeetingViewQuery.key(groupId, meetingId)`.
- Calls the member-facing detail endpoint only.
- Returns typed `MeetingDetailView` data for the summary page.

### `useEditableMeetingQuery`

- Uses `useQuery`.
- Exports `useEditableMeetingQuery.key(groupId, meetingId)`.
- Calls the admin-only edit endpoint only.
- Returns typed `EditableMeetingForm` data for form initialization and publish helper text.

### `useSaveMeetingMutation`

- Uses `useMutation` with `mutateAsync` as the primary invocation style.
- Sends only changed fields to the edit patch endpoint.
- Invalidates or patches `useEditableMeetingQuery.key(...)` and any dependent meeting view caches after successful saves.

### `usePublishMeetingMutation`

- Uses `useMutation` with `mutateAsync`.
- Calls the dedicated publish endpoint.
- Reconciles both edit and view queries so status, helper text, and publish CTA visibility update immediately.

## Form Hook Responsibilities

### `useMeetingForm`

- Owns editable field state, touched state, validation, save status, and debounce timer.
- Receives the initial edit DTO and derives the presentational props for `MeetingForm`.
- Schedules autosave after a short inactivity window instead of saving on every keystroke.
- Calls `useSaveMeetingMutation` when the debounced patch is ready.
- Triggers `alert.success(...)` after a confirmed autosave and `alert.error(...)` on failure.
- Keeps unsaved local state intact if a save fails.

## UI Contract

- `MeetingFeedItem` shows a `view meeting` action for all visible meetings.
- `MeetingFeedItem` shows an `edit meeting` action only for admins and owners.
- `GroupMeetingsSection` shows grouped `view` and `edit` actions at the top-right of each admin-visible meeting row.
- Meeting view page shows the signed-in user's attendance state near the top plus a quick check-in control.
- Meeting view page shows an `edit meeting` action near the top only when `canEdit=true`.
- Edit page shows a bright publish button when `canPublishNow=true` plus helper text derived from `publishScheduledFor`.
