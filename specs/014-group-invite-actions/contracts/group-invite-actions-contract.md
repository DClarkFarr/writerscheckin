# Contract: Respond To Group Invite

## Endpoint

- Method: `POST`
- Path: `/api/groups/members/:membershipId/respond`
- Body:

```json
{
  "action": "accept" | "decline"
}
```

## Authorization

- Caller must be authenticated.
- Membership must belong to authenticated user.
- Membership status must currently be `invited`.

## Success Response

```json
{
  "membershipId": "string",
  "groupId": "string",
  "status": "accepted" | "declined",
  "actedAt": "2026-05-06T12:34:56.000Z",
  "redirectTo": "/groups/<groupId>/view" | null
}
```

Rules:

- `action=accept` -> `status=accepted`, `redirectTo` points to group view page.
- `action=decline` -> `status=declined`, `redirectTo=null`.

## Error Responses

- `400`: invalid action or invalid status transition.
- `401`: unauthenticated.
- `403`: membership does not belong to user.
- `404`: membership not found.
- `409`: membership already handled (not pending).

## Frontend Cache Contract

Mutation hook responsibilities (`useRespondToGroupInviteMutation`):

- On mutate:
  - cancel/snapshot `myGroupQueryKey("invited")`
  - cancel/snapshot `myGroupQueryKey("accepted")`
  - optimistic remove invite row from invited cache
  - if `accept`, optimistic prepend invite row into accepted cache when first page data exists
- On error:
  - rollback snapshot
- On settled:
  - invalidate `myGroupQueryKey("invited")`
  - invalidate `myGroupQueryKey("accepted")`
  - invalidate `myMeetingsQueryKey()`

Navigation behavior:

- Invite action caller (`useGroupInvites`) MUST navigate to `/groups/$groupId/view` after successful `accept`.
- `decline` MUST not navigate and should keep user on My Groups tab.

This guarantees My Groups current tab and My Meetings tab are refreshed after invite actions.
