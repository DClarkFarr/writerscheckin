# Contract: Check-in Eligibility

## Scope

Defines authoritative eligibility rules for meeting check-in updates.

## Entry Point

- Service: `updateMeetingCheckin`
- Route: `POST /api/groups/meetings/:meetingId/checkin`

## Inputs

```json
{
  "meetingId": "<meeting-id>",
  "userId": "<user-id>",
  "state": "attending | reading | not_attending"
}
```

## Eligibility Rules

1. Meeting must exist.
2. Membership for (`userId`, `meeting.groupId`) must exist and be `accepted`.
3. Meeting must still be upcoming per existing service rule.
4. Current time must be before `checkinClosesAt`.
5. Eligibility MUST NOT require current calendar date to equal meeting date.

## Success Result

```json
{
  "meetingId": "m1",
  "groupId": "g1",
  "userCheckinState": "attending",
  "attendingCount": 10,
  "readingCount": 3,
  "appliedAt": "2026-05-16T18:00:00.000Z"
}
```

## Failure Modes

- `404`: meeting not found
- `403`: membership missing or not accepted
- `409`: meeting no longer upcoming
- `409`: check-in period has ended

## Invariants

- Server-side validation remains source of truth for write operations.
- Frontend display state can be optimistic but must reconcile with service responses.
- Error semantics and status mapping remain backward-compatible.
- Frontend must not add same-day calendar gating on top of these eligibility rules.
