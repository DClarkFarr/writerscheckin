# Contract: Pending Invite Accept/Decline Actions

## Purpose

Define action behavior for users with pending invites who open a meeting invite link.

## Scope

- Layer: service mutations exposed by existing routers for invite resolution.
- Applies only when `accessState = pending_invite`.

## Contract

### Input

- `groupId`
- `meetingId`
- authenticated `userId`
- `decision` in `{ "accept", "decline" }`

### Preconditions

- Current state must be `pending_invite`.
- User identity must match invite target identity.

### Effects

- `accept`:
  - membership transitions to active.
  - follow-up response indicates active access path.
- `decline`:
  - membership transitions to declined/left state.
  - follow-up response confirms declined outcome.

### Output

- `updatedState`
- `messageKey`
- `canProceedToMeeting` boolean

### Error behavior

- Invalid transition (non-pending current state) returns deterministic validation/authorization error.
- Duplicate submissions are idempotent by state (no conflicting transitions).

## Invariants

- Accept/decline transitions are only valid from pending state.
- Result payload is immediately renderable by invite landing UI.
