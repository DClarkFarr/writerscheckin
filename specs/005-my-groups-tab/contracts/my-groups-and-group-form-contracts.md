# My Groups and Group Form Contracts

## Scope

Defines frontend/backend interface contracts for My Groups list rendering, group create/edit flows, group activation transitions, and upcoming-meeting creation redirect behavior.

## Contract 1: My Groups List Query

- Endpoint: `GET /api/groups/mine`
- Query params:
  - `cursor` (optional string)
  - `limit` (optional number, bounded)
- Response:
  - `items: MyGroupListItem[]`
  - `nextCursor: string | null`
- Behavior:
  - Returns groups for authenticated user only.
  - Supports stable cursor pagination for infinite scrolling.
  - Excludes soft-deleted records from user-visible list.

## Contract 2: Group Summary Item Shape

Each returned item must include:

- `groupId`, `name`, `recurrence`, `isActive`
- `activeMemberCount`, `invitedMemberCount`, `pastMeetingCount`
- `nextUpcomingMeeting` (nullable)
- `availableActions` booleans required by UI action rendering

## Contract 3: Create Group

- Endpoint: `POST /api/groups`
- Request body must include form fields:
  - `name`, `description`, `address`, `startTime`, `durationMinutes`, `recurrence`, `publicMessage`, `attendanceMessage`
  - `adminUserIds[]`, `memberUserIds[]`
- Response:
  - Created group identifier and summary fields needed for immediate UI/navigation.
- Navigation contract:
  - Create page canonical URL is `/groups/create`.

## Contract 4: Edit Group

- Endpoint: `PATCH /api/groups/:groupId`
- Request body reuses create/edit form shape with partial/full updates.
- Response:
  - Updated group summary + effective activation state.
- Navigation contract:
  - Edit page canonical URL is `/groups/:groupId/edit`.

## Contract 5: Participant Search (Admins/Members)

- Endpoint: `GET /api/groups/participants/search`
- Query params:
  - `q` (search term)
  - `limit` (optional)
- Response items must include:
  - `userId`, `displayName`, `avatarUrl`, and eligibility metadata.
- UI rendering contract:
  - Search options show avatar + name.
  - Selected users are displayed beneath each select as list items with avatar + name.

## Contract 6: Activation/Deactivation Action

- Endpoint: `PATCH /api/groups/:groupId/state`
- Request body:
  - `active: boolean`
- Behavior:
  - Applies valid transition only.
  - Returns updated state and refreshed action eligibility.

## Contract 7: Upcoming Meeting Creation from Group Defaults

- Endpoint: `POST /api/groups/:groupId/meetings/upcoming`
- Request body:
  - Optional override metadata (if any); defaults copied from group configuration.
- Response:
  - `groupId`, `meetingId`, `redirectTo`, `createdFromDefaults: true`
- Redirect contract:
  - `redirectTo` must resolve to `/groups/:groupId/meetings/:meetingId/edit`.

## Contract 8: Group Meeting Edit URL

- Canonical frontend route must support:
  - `/groups/:groupId/meetings/:meetingId/edit`
- Frontend route parameter validation:
  - Missing/invalid params result in safe not-found or forbidden UX.

## Error Contracts

- Unauthorized access: `401` with authenticated-session handling.
- Forbidden group/meeting action: `403`.
- Invalid payload or illegal state transition: `400` with actionable message.
- Missing group or meeting: `404`.
- Server failures: `5xx` with generic UI-safe error fallback.

## Out of Scope

- Meeting attendance editing details beyond redirect destination.
- Advanced rich-text toolbar features beyond basic mode.
- Bulk group operations across multiple groups.
