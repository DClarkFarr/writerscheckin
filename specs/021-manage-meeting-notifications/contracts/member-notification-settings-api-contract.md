# Contract: Member Notification Settings API

## Scope

Expose read and toggle-update operations for the authenticated member's per-group meeting notification preferences.

## Endpoints

- `GET /api/groups/:groupId/notifications/me`
- `PATCH /api/groups/:groupId/notifications/me`

## Authorization

- Caller must be authenticated.
- Caller must have an accepted membership in `:groupId`.
- Non-members or removed/cancelled members receive authorization/not-found style failure via existing error handling.

## GET Response

```json
{
  "groupId": "<groupId>",
  "membershipId": "<membershipId>",
  "unsubscribedNotifications": {
    "newMeetingPublication": true,
    "meetingAttendanceUpdates": true
  },
  "updatedAt": "2026-05-15T18:20:11.000Z"
}
```

Rules:

- `unsubscribedNotifications` may be `{}` when fully subscribed.
- Only known keys are returned.

## PATCH Request

```json
{
  "notificationType": "meetingAttendance",
  "unsubscribed": true
}
```

### Request Rules

- `notificationType` is required and must be one of:
  - `newMeetingPublication`
  - `newMeetingCheckin`
  - `meetingAttendance`
  - `meetingAttendanceUpdates`
- `unsubscribed` is required boolean.

### PATCH Behavior

- `unsubscribed: true`: set `unsubscribedNotifications[notificationType] = true`.
- `unsubscribed: false`: set `unsubscribedNotifications[notificationType] = false`.

### PATCH Response

Returns the same shape as GET with the updated map.

## Error Contract

- Invalid `notificationType` or malformed body: validation failure (400).
- Unauthorized session: 401.
- Authenticated but not an eligible group member: authorization/not-found failure mapped by existing pipeline.

## Backward Compatibility

- Existing group APIs are unchanged.
- This is an additive endpoint surface with no breaking schema changes for unrelated clients.
