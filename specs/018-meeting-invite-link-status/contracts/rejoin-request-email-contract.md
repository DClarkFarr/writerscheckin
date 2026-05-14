# Contract: Rejoin Request Email Notification

## Purpose

Define request-to-join behavior for users in declined/left/removed states and corresponding admin email notification requirements.

## Scope

- Layer: invite recovery service and email template/send service integration.
- Applies when `accessState` is `declined_or_left` or `removed`.

## Contract

### Input

- `groupId`
- `meetingId`
- authenticated requester identity (`userId`, `email`)

### Preconditions

- Current resolved state must be `declined_or_left` or `removed`.
- Responsible admin recipient for the group can be resolved.

### Effects

- Create/send join-request notification to responsible group admin.
- Include requester email and group/meeting context in message body.
- Membership state remains unchanged until admin takes separate reinvite action.

### Output

- Success response with confirmation message key and delivery acceptance metadata (if available).

### Failure behavior

- If recipient admin email cannot be resolved, return explicit user-facing failure outcome.
- If send operation fails, return explicit user-facing failure outcome and avoid silent success.

## Email payload requirements

- `to`: responsible admin email
- `subject`: indicates user requested to rejoin
- `requesterEmail`: mandatory
- `groupName`: mandatory
- `meetingReference`: mandatory

## Invariants

- Every successful request includes requester identity and target context.
- Request submission does not automatically modify membership.
