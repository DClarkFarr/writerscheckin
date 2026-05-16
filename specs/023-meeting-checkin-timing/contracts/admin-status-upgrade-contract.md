# Contract: Admin Status Upgrade

## Scope

Defines API contract for group admins to manually upgrade any attendee's check-in status regardless of window state.

## Entry Point

- Service: `adminUpgradeMeetingAttendee`
- Route: `PATCH /groups/meetings/:meetingId/attendees/:memberId/status`

## Inputs

```json
{
  "status": "reading | attending | skipping"
}
```

## Authorization

1. Request must include authenticated session (`req.session.userId`)
2. User must be in `groupMembers` collection with:
   - `groupId` = `meeting.groupId`

- `role` in `"admin" | "owner"`
- `status` = `"accepted"`

3. Non-admins receive `403 Forbidden`

## Validation Rules

1. Meeting must exist
2. Attendee must exist in meeting (resolved by `meetingId + memberId`)
3. `status` must be a valid status: `"reading"`, `"attending"`, or `"skipping"`
4. `status` must be higher rank than current status (upgrade only):
   - Current `"skipping"` (rank 1) can upgrade to `"attending"` (rank 2) or `"reading"` (rank 3)
   - Current `"attending"` (rank 2) can upgrade to `"reading"` (rank 3)
   - Current `"reading"` (rank 3) cannot upgrade further; same-status no-op allowed
5. Admin CANNOT downgrade (or perform same-level update); invalid transition results in `409 Conflict`
6. Check-in window state is IGNORED (no open/closed/not-started gating)

## Success Result

```json
{
  "meetingId": "m1",
  "groupId": "g1",
  "userCheckinState": "reading",
  "attendingCount": 10,
  "readingCount": 3,
  "appliedAt": "2026-05-16T18:15:30.000Z"
}
```

## Failure Modes

- `400 Bad Request`: Invalid body value for `status`
- `403 Forbidden`: User is not authenticated or not a group admin
- `404 Not Found`: Meeting or attendee not found
- `409 Conflict`: Invalid status hierarchy transition (including downgrade/same-level)

## State Changes

- Updates `meetingAttendees.status` to `status`
- Sets `meetingAttendees.changedBy` to requesting user ID
- Sets `meetingAttendees.isAdminOverride` to `true`
- Updates `meetingAttendees.updatedAt` to current timestamp
- Creates audit log entry in `meetingAttendanceLogs` with:
  - `status`: resulting attendee status
  - `userId`: requesting admin user ID
  - `meetingId`, `memberId`, `groupId`

## Invariants

1. Admin upgrades are unrestricted by window state (no start/close gate)
2. Only upgrades allowed; downgrades rejected with error
3. Last-write-wins for concurrent updates (MongoDB atomic update)
4. Audit trail preserved in `meetingAttendanceLogs`
5. Response includes updated attendee status + metadata for cache invalidation

## Concurrency Handling

- No optimistic locking or versioning
- Last successful write wins
- Frontend should display updated status immediately (optimistic) or request fresh data
- Audit trail can be inspected if full history needed

## Rate Limiting

- Subject to existing rate limiter on group endpoints
- No special rate limiting for admin operations

## UI Implications

- Frontend admin interface should display attendee list with upgrade buttons
- Buttons disabled for non-admins
- Buttons enabled for admins even when window is closed
- Success: show confirmation and update local state
- Failure: show error modal with reason why upgrade failed
