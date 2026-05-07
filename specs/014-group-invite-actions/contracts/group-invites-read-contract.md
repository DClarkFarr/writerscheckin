# Contract: Read Pending Group Invites

## Endpoint

- Method: `GET`
- Path: `/api/groups/mine`
- Query:
  - `status=invited` (required for invite list use case)
  - `cursor` (optional)
  - `limit` (optional)

## Purpose

Reuse existing groups membership listing endpoint to source:

- My Groups tab pending invite badge count
- Group Invites card list rows

## Response

```json
{
  "items": [
    {
      "groupId": "string",
      "name": "string",
      "recurrence": "weekly|biweekly",
      "createdAt": "2026-05-06T12:34:56.000Z",
      "isActive": true,
      "userRole": "member",
      "counts": {
        "activeMembers": 5,
        "invitedMembers": 2,
        "pastMeetings": 12
      },
      "nextUpcomingMeeting": {
        "meetingId": "string",
        "startsAt": "2026-05-14T18:00:00.000Z"
      },
      "availableActions": {
        "canActivate": false,
        "canDeactivate": false,
        "canViewUpcomingMeeting": true
      }
    }
  ],
  "nextCursor": "string|null"
}
```

## Behavioral Requirements

- Must return only memberships with invite status `invited` for authenticated user.
- Consumer must sort rows by invite creation timestamp (descending) when rendering.
- Empty response (`items: []`) means no badge and no Group Invites card content.

## Errors

- `401` unauthorized when no authenticated session.
- `400` for invalid status query value.
- `5xx` generic server error with standard API error envelope.
