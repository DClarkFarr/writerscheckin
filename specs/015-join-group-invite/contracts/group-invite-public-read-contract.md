# Contract: Read Join Group Invite (Public)

## Endpoint

- Method: `GET`
- Path: `/api/group-invites/:membershipId`
- Query:
  - `inviteToken=string` (required)

## Authorization

- No authenticated session required.
- Invite token must be valid for the referenced membership.

## Success Response

```json
{
  "membershipId": "string",
  "groupId": "string",
  "groupName": "string",
  "address": "string",
  "nextMeetingStartsAt": "2026-05-20T18:00:00.000Z",
  "status": "pending",
  "canAccept": true,
  "canDecline": true
}
```

Non-pending example:

```json
{
  "membershipId": "string",
  "groupId": "string",
  "groupName": "string",
  "address": "string",
  "nextMeetingStartsAt": null,
  "status": "declined",
  "canAccept": false,
  "canDecline": false
}
```

## Error Responses

- `400`: missing or malformed `inviteToken`.
- `404`: membership does not exist.
- `410`: invite token invalid/expired for this membership.

## Client Behavior Contract

- Join page must load this endpoint on initial render for both signed-in and signed-out sessions.
- UI actions are derived from `canAccept` and `canDecline`; disabled/non-actionable states must be shown when false.
