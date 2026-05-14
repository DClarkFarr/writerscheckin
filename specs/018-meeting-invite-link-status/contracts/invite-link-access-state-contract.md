# Contract: Invite Link Access State Resolution

## Purpose

Define backend behavior for resolving and returning status-specific invite-link outcomes for meeting invite URLs.

## Scope

- Layer: services/models used by invite-link meeting access flow.
- Applies when a user opens a meeting invite URL but is not yet an active member.

## Contract

### Input

- `meetingId`
- `groupId`
- authenticated `userId`

### Resolution rules

- Resolve one canonical `accessState` from:
  - `active_member`
  - `pending_invite`
  - `not_invited`
  - `declined_or_left`
  - `removed`
  - `unknown_or_expired`
- Resolution uses direct user+group membership/invite lookup semantics.

### Output

- For non-active states, response includes:
  - `groupName`
  - `groupDescription`
  - `accessState`
  - `messageKey`
  - `availableActions`
- For `active_member`, existing normal meeting flow applies.

### Error and retry behavior

- Known authorization outcomes are represented as typed states, not generic forbidden UI errors.
- Client query behavior should treat resolved non-active outcomes as terminal for automatic retry purposes in this flow.

## Invariants

- Exactly one `accessState` is returned per request.
- `groupName` and `groupDescription` are present for all non-active outcomes.
