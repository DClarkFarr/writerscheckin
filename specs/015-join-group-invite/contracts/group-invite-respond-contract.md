# Contract: Respond To Join Group Invite

## Endpoint

- Method: `POST`
- Path: `/api/group-invites/:membershipId/respond`
- Body:

```json
{
  "action": "accept" | "decline",
  "inviteToken": "string"
}
```

## Authorization

- Token validation is required for all actions.
- `decline` does not require an authenticated session.
- `accept` requires an authenticated session and invite ownership match.

## Success Response

```json
{
  "membershipId": "string",
  "groupId": "string",
  "status": "accepted" | "declined",
  "actedAt": "2026-05-08T12:34:56.000Z",
  "redirectTo": "/" | ""
}
```

Rules:

- `action=accept` -> `status=accepted`, `redirectTo="/"`.
- `action=decline` -> `status=declined`, `redirectTo=""` (stay on invite page).

## Error Responses

- `400`: invalid action or malformed token.
- `401`: unauthenticated accept attempt.
- `403`: authenticated user does not own invite.
- `404`: membership not found.
- `409`: invite already handled.
- `410`: invite token invalid/expired.

## Client Behavior Contract

- Signed-out Join click opens login modal before calling `accept`.
- After successful modal login, client automatically retries `accept` once using original `membershipId` + `inviteToken`.
- Decline click opens confirmation dialog; on confirm, call decline endpoint and re-fetch invite details to render final status.
