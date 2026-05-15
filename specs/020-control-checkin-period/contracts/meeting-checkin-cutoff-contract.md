# Contract: Meeting Check-In Cutoff Enforcement

## Scope

Enforce check-in cutoff in update endpoint and align disabled-state UX messaging.

## Endpoint

- `POST /api/groups/meetings/:meetingId/checkin`

## Request Body

- `state: "attending" | "reading" | "not_attending"`

## Validation Rules

1. User must be an accepted group member.
2. Meeting must exist and be check-in eligible by state.
3. Check-in cutoff must not have passed.

Cutoff evaluation:

- `checkinClosesAt = meeting.occursAt - meeting.endCheckinHoursBefore`
- Reject when `now >= checkinClosesAt` even if `now < occursAt`.

## Error Semantics

When cutoff has passed:

- Return conflict-style error (HTTP 409) with message indicating check-in period has ended.

When meeting is past/invalid membership/etc:

- Preserve existing authorization/validation semantics.

## UI Consistency Requirements

Any view that renders check-in buttons must surface:

- A check-in time-limit message.
- Disabled-state explanation when cutoff has ended (tooltip or equivalent helper text).

Message formatting:

- Same-day cutoff: relative countdown text.
- Different-day cutoff: absolute date + time text.
