# Contract: Meeting Inherits Group Check-In Cutoff

## Scope

Ensure meetings created from group defaults persist inherited `endCheckinHoursBefore`.

## Endpoint

- `POST /api/groups/:groupId/meetings/upcoming`

## Inheritance Rules

1. Read source group defaults at creation time.
2. Set meeting `endCheckinHoursBefore` to group `endCheckinHoursBefore`.
3. Persist inherited value in meeting document.
4. Subsequent group default changes do not retroactively mutate existing meetings.

## Read Surface Expectations

Meeting payloads used by check-in views expose enough data to compute cutoff messaging and availability. This can be satisfied by either:

- Returning `endCheckinHoursBefore` with meeting data; or
- Returning computed cutoff metadata (`checkinClosesAt`, message fields).

Chosen implementation must be consistent across all check-in button surfaces.

## Validation

- If source group has invalid/missing `endCheckinHoursBefore`, meeting creation fails with validation error.
