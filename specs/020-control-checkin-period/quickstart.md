# Quickstart: Control Check-In Period

## Goal

Implement configurable check-in close windows with inheritance from group defaults and strict endpoint enforcement.

## Implementation Order

1. Backend model updates

- Add `endCheckinHoursBefore` to group and meeting model definitions.
- Reuse existing non-negative integer validation helpers.

2. Backend service and router updates

- Extend group create/update/get service flows to include `endCheckinHoursBefore`.
- Update meeting creation-from-defaults to inherit `endCheckinHoursBefore`.
- Update check-in availability derivation for meeting detail/feed read paths.
- Enforce cutoff in `updateMeetingCheckin` endpoint path.

3. Frontend API + form wiring

- Extend API types and normalization for group + meeting responses.
- Add numeric group form field: "Check-in closes (hours before start)".
- Validate field client-side and include in create/edit payloads.

4. Frontend check-in surfaces

- Update all check-in button surfaces to show cutoff time-limit message.
- Disable check-in if cutoff passed before meeting start.
- Show tooltip/helper reason when disabled due to cutoff.
- Render same-day relative countdown vs different-day absolute date/time text.

5. Verification

- Confirm new meetings inherit group value.
- Confirm existing meetings are unaffected by later group changes.
- Confirm endpoint rejects post-cutoff check-in requests.
- Confirm all check-in views show consistent cutoff messaging.

## Manual Validation Scenarios

1. Group settings save

- Edit group, set `endCheckinHoursBefore = 4`, save, reload, verify persisted.

2. Meeting inheritance

- Create upcoming meeting from same group, inspect returned/loaded meeting data, verify inherited value is `4`.

3. Cutoff disables before start

- For meeting starting in 2 hours with `endCheckinHoursBefore = 3`, verify check-in is disabled and explains cutoff ended.

4. Endpoint enforcement

- Call check-in endpoint for post-cutoff upcoming meeting; verify 409 response and no attendee status mutation.

5. Message format behavior

- Same-day cutoff: message uses "ends in" countdown style.
- Next-day cutoff: message uses absolute date/time style.

## Build Checks

- `cd express && npm run build`
- `cd web && npx tsc --noEmit`

## API/Response Examples

Group create/update payload includes the new numeric cutoff field:

```json
{
  "name": "Friday Critique",
  "description": "Weekly peer review",
  "address": "Library Room 2",
  "startTime": { "hours": 18, "minutes": 30 },
  "durationMinutes": 90,
  "recurrenceFrequency": "weekly",
  "recurrenceDaysOfWeek": [5],
  "endCheckinHoursBefore": 4,
  "publicMessage": "See you there.",
  "attendanceMessage": "Thanks for confirming."
}
```

Meeting read surfaces expose cutoff metadata:

```json
{
  "meetingId": "...",
  "occursAt": "2026-05-20T22:30:00.000Z",
  "endCheckinHoursBefore": 4,
  "checkinClosesAt": "2026-05-20T18:30:00.000Z",
  "isCheckinClosedByCuttoff": false,
  "checkinPeriodMessage": "Check-in period ends in 3 hours 12 minutes 1 seconds",
  "canCheckin": true
}
```

When cutoff is passed, check-in endpoint returns conflict-style response:

```json
{
  "message": "Check-in period has ended."
}
```

## Validation Outcomes (2026-05-14)

- Backend compile: PASS (`cd express && npm run build`)
- Frontend typecheck: PASS (`cd web && npx tsc --noEmit`)
- Route conflict contract: PASS (409 conflict message normalized for cutoff-ended check-in)
- UI cutoff messaging and tooltip behavior: Implemented in meeting detail, feed card, and drawer surfaces
- Manual browser walkthrough scenarios: Pending live interactive verification
