# Contract: Meeting Detail, Edit, Publish, And Check-In APIs

## Goals

- Keep meeting detail and admin edit payloads on separate endpoints.
- Enforce membership and admin permissions server-side.
- Support debounced autosave patches and explicit draft publishing.

## Endpoint: `GET /groups/:groupId/meetings/:meetingId`

Purpose: Return the member-facing meeting detail view for any authorized user.

### Response

```json
{
  "meetingId": "m_123",
  "groupId": "g_123",
  "groupName": "North Side Writers",
  "name": "Weekly Critique",
  "occursAt": "2026-05-20T18:00:00.000Z",
  "address": "123 Main Street",
  "description": "Bring 5 pages.",
  "startTime": { "hours": 18, "minutes": 0 },
  "durationMinutes": 120,
  "status": "published",
  "userCheckinState": "reading",
  "canCheckin": true,
  "canEdit": true,
  "attendingCount": 6,
  "readingCount": 2,
  "participantRows": [
    {
      "memberId": "gm_1",
      "userId": "u_1",
      "displayName": "Alice Example",
      "avatarUrl": null,
      "role": "member",
      "membershipStatus": "accepted",
      "attendanceState": "attending",
      "isCurrentUser": false
    }
  ]
}
```

### Rules

- User must be an authenticated accepted member of the group.
- Draft meetings are visible only to admins and owners.
- Response intentionally excludes admin-only edit fields such as publish message templates and publish timing settings.

## Endpoint: `GET /groups/:groupId/meetings/:meetingId/edit`

Purpose: Return the richer admin-only edit payload for meeting management.

### Response

```json
{
  "meetingId": "m_123",
  "groupId": "g_123",
  "name": "Weekly Critique",
  "occursAt": "2026-05-20T18:00:00.000Z",
  "description": "Bring 5 pages.",
  "address": "123 Main Street",
  "startTime": { "hours": 18, "minutes": 0 },
  "durationMinutes": 120,
  "publishEmailMessage": "Your meeting is live.",
  "attendanceEmailMessage": "Please confirm attendance.",
  "publishHoursBefore": 48,
  "notifyAttendanceHoursBefore": 24,
  "status": "draft",
  "publishScheduledFor": "2026-05-18T18:00:00.000Z",
  "canPublishNow": true,
  "savedAt": null
}
```

### Rules

- User must be an accepted admin or owner of the group.
- This endpoint is distinct from the view endpoint because it returns admin-only editable fields.

## Endpoint: `PATCH /groups/:groupId/meetings/:meetingId/edit`

Purpose: Persist a debounced autosave patch for editable meeting fields.

### Request Body

```json
{
  "name": "Weekly Critique",
  "description": "Bring 7 pages.",
  "publishHoursBefore": 24
}
```

All fields are optional; clients send only changed values.

### Response

```json
{
  "meetingId": "m_123",
  "savedAt": "2026-05-03T22:15:00.000Z",
  "status": "draft",
  "publishScheduledFor": "2026-05-19T18:00:00.000Z",
  "updatedFields": ["description", "publishHoursBefore"]
}
```

### Rules

- User must be an accepted admin or owner.
- Existing meeting validation rules continue to apply for name, start time, duration, publish hours, and attendance notification hours.
- Omitted optional fields are treated as unchanged.

## Endpoint: `POST /groups/:groupId/meetings/:meetingId/publish`

Purpose: Publish a draft meeting immediately.

### Response

```json
{
  "meetingId": "m_123",
  "status": "published",
  "publishedAt": "2026-05-03T22:16:10.000Z",
  "attendanceEnabled": true
}
```

### Rules

- User must be an accepted admin or owner.
- Draft meetings publish exactly once.
- Successful publish makes member-facing attendance flows available immediately.

## Endpoint: `POST /groups/meetings/:meetingId/checkin`

Purpose: Update the signed-in user's attendance from the meeting view page.

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
  "appliedAt": "2026-05-03T22:18:00.000Z"
}
```

### Rules

- User must be eligible to check in for the target upcoming meeting.
- Response values are canonical and suitable for cache reconciliation.
