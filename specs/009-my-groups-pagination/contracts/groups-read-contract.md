# Contract: Groups Read Responses

## Goals

- Standardize group responses so group records expose counts but not full member arrays.
- Separate group summary/detail reads from member and meeting collection reads.
- Use a consistent paginated envelope for incremental loading.

## Endpoints

### `GET /groups/mine`

Purpose: Return paginated group summary rows for the authenticated user’s My Groups feed.

Request query:

- `status` optional membership status filter
- `cursor` optional cursor token
- `limit` optional page size, default `20`, max follows server pagination policy

Response:

```json
{
  "items": [
    {
      "groupId": "...",
      "name": "...",
      "recurrence": "weekly",
      "isActive": true,
      "userRole": "owner",
      "counts": {
        "activeMembers": 4,
        "invitedMembers": 1,
        "pastMeetings": 12
      },
      "nextUpcomingMeeting": {
        "meetingId": "...",
        "startsAt": "2026-05-10T17:00:00.000Z"
      },
      "availableActions": {
        "canActivate": false,
        "canDeactivate": true,
        "canViewUpcomingMeeting": true,
        "canCreateManualMeeting": false
      }
    }
  ],
  "nextCursor": "..."
}
```

Rules:

- `items` contains summary rows only.
- No row includes `members`.
- `nextCursor` is `null` when there are no more groups.

### `GET /groups/:groupId`

Purpose: Return group detail summary fields needed by view/edit screens, excluding collection payloads.

Response requirements:

- Includes summary fields plus editable/detail fields such as description, address, recurrence inputs, and messaging fields.
- Does not include `members`.
- Does not include meetings rows.

### `GET /groups/:groupId/members`

Purpose: Return one 20-item member batch for the opened group.

Request query:

- `cursor` optional cursor token
- `limit` optional, defaults to `20`

Response:

```json
{
  "rows": [
    {
      "_id": "...",
      "identifier": "...",
      "userId": "...",
      "email": "member@example.com",
      "name": "Member Name",
      "avatarUrl": null,
      "role": "member",
      "status": "accepted"
    }
  ],
  "nextCursor": "..."
}
```

Rules:

- Authorization is enforced independently of `/groups/:groupId`.
- Rows append in stable order across pages.
- `nextCursor` is `null` when no more members remain.

### `GET /groups/:groupId/meetings`

Purpose: Return one 20-item meeting batch for the opened group.

Request query:

- `cursor` optional cursor token
- `limit` optional, defaults to `20`

Response:

```json
{
  "rows": [
    {
      "meetingId": "...",
      "occursAt": "2026-05-03T17:00:00.000Z",
      "status": "published"
    }
  ],
  "nextCursor": "..."
}
```

Rules:

- Rows are ordered newest to oldest by occurrence timestamp.
- A later page only contains meetings older than those already returned.
- `nextCursor` is `null` when no more meetings remain.
