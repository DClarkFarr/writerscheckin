# Contract: My Meetings Read And Check-In APIs

## Goals

- Standardize all meeting feed objects returned to My Meetings clients.
- Enforce role-based visibility rules server-side.
- Support infinite cursor pagination and optimistic check-in reconciliation.

## Endpoint: `GET /groups/meetings/mine`

Purpose: Return standardized meeting feed rows for the authenticated user.

### Request Query

- `cursor` optional cursor token.
- `limit` optional page size (default `20`).

### Response

```json
{
  "items": [
    {
      "meetingId": "m_123",
      "groupId": "g_123",
      "groupName": "North Side Writers",
      "name": "Weekly Critique",
      "occursAt": "2026-05-20T18:00:00.000Z",
      "segment": "upcoming",
      "status": "draft",
      "isDraft": true,
      "isAdminOnly": true,
      "showAdminOnlyBadge": true,
      "attendingCount": 6,
      "readingCount": 2,
      "userCheckinState": "reading",
      "canCheckin": true,
      "displayTone": "blue"
    }
  ],
  "nextCursor": "opaque-cursor"
}
```

### Feed Rules

- Upcoming rows always precede past rows.
- Members (`member` role):
  - Upcoming includes only the next upcoming published meeting per group.
  - Past includes all published past meetings.
  - Draft rows are excluded.
- Admins/owners (`admin` or `owner` role):
  - Upcoming includes published rows and upcoming draft rows.
  - Draft rows set `isAdminOnly=true` and `showAdminOnlyBadge=true`.
  - Past includes published past meetings.
- Sorting inside segments:
  - Upcoming: `occursAt` ascending, then `name` ascending, then `meetingId` ascending.
  - Past: `occursAt` descending, then `name` ascending, then `meetingId` ascending.
- Cursor continuation key is segment-aware and encoded from `(segment, occursAt, name, meetingId)`.
- `nextCursor=null` indicates end-of-feed.

## Endpoint: `POST /groups/meetings/:meetingId/checkin`

Purpose: Set authenticated user's check-in state for an upcoming meeting.

### Request Body

```json
{
  "state": "attending"
}
```

Allowed `state` values: `attending`, `reading`, `not_attending`.

### Response

```json
{
  "meetingId": "m_123",
  "userCheckinState": "attending",
  "attendingCount": 7,
  "readingCount": 2,
  "appliedAt": "2026-05-03T21:40:11.000Z"
}
```

### Mutation Rules

- Server validates the user is eligible to check in for the target upcoming meeting.
- Server returns canonical counts and state after update for cache reconciliation.
- Repeated submissions of the same state are idempotent and return current canonical values.
