# Contract: Check-in Eligibility

## Scope

Defines authoritative eligibility rules for attendee self-initiated meeting check-in status updates.

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

## Eligibility Rules: Initial Check-In

1. Meeting must exist.
2. Membership for (`userId`, `meeting.groupId`) must exist and be `accepted`.
3. Meeting must still be upcoming (occursAt > now).
4. **Check-in window must be open**: `currentTime >= checkinStart AND currentTime < checkinEnd`

- `checkinStart` is computed from existing meeting timing metadata
- `checkinEnd = meeting.occursAt - (meeting.endCheckinHoursBefore * 3600 seconds)`

5. While open, attendee can submit allowed check-in states through normal check-in endpoint
6. Eligibility MUST NOT require current calendar date to equal meeting date

## Eligibility Rules: Status Changes After Check-In Period Closes

1. Meeting must exist.
2. Membership and role same as above.
3. Check-in window must be **closed**: `currentTime >= checkinEnd`
4. Only **downgrades** allowed:
   - `reading` → `attending` or `skipping`
   - `attending` → `skipping`
   - `skipping` → (no further downgrade; already lowest)
5. Upgrades blocked: `attending` → `reading` or `skipping` → `attending` result in `409 Conflict`

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
- `409`: meeting no longer upcoming (past meeting)
- `409`: check-in period has not yet started
- `409`: check-in period has ended (unless valid downgrade)
- `409`: invalid status transition (upgrade attempted when period closed)

## Invariants

1. Endpoint is attendee self-service; admin upgrades are handled by dedicated admin endpoint
2. Window state gates all operations (open for initial check-in, closed for downgrades only)
3. Status hierarchy enforced: `reading` (rank 3) > `attending` (rank 2) > `skipping` (rank 1)
4. Attendees cannot upgrade after window closes; admin override required
5. Last-write-wins for concurrent updates
6. Audit trail preserved in `meetingAttendanceLogs`

## State Changes on Success

- Creates or updates `meetingAttendees` record with new status
- Sets `changedBy` to requesting user ID
- Sets `isAdminOverride` to `false` (attendee self-initiated change)
- Updates `updatedAt` to current timestamp
- Creates audit log in `meetingAttendanceLogs`
- Increments/decrements aggregate counts

## Concurrency Handling

- No optimistic locking
- Last write wins
- Frontend should optimistically update UI
- Fallback to server state if conflict detected

## Rate Limiting

- Subject to existing endpoint rate limiting
- No special constraints per this spec

- Server-side validation remains source of truth for write operations.
- Frontend display state can be optimistic but must reconcile with service responses.
- Error semantics and status mapping remain backward-compatible.
- Frontend must not add same-day calendar gating on top of these eligibility rules.
