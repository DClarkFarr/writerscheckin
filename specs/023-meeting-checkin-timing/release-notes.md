# Release Notes: 023 Meeting Check-in Timing

## Summary

This release updates check-in timing and post-window status management for group meetings.

## What Changed

- Cross-day check-in eligibility is enforced via timestamp-based window checks.
- Active check-in messaging/countdown behavior is aligned across feed and detail views.
- Pre-open action labels remain static (`Check-in starts soon`).
- After check-in closes, attendees may only downgrade status.
- Group admins (and owners) can upgrade attendee status at any time.

## API Changes

- Added admin endpoint:
  - `PATCH /groups/meetings/:meetingId/attendees/:memberId/status`
- Existing endpoint behavior extended:
  - `POST /groups/meetings/:meetingId/checkin` now supports downgrade-only transitions after close.

## Data Model Updates

- `groupMeetings` includes `startCheckinHoursAfterCreation` (default `0`).
- `meetingAttendees` includes audit metadata:
  - `changedBy`
  - `isAdminOverride`

## Audit and Real-Time

- Attendee and admin status changes append entries to `meetingAttendanceLogs`.
- Meeting detail admin surface refreshes attendee state on `meeting` socket updates.

## Validation

- Backend TypeScript compile passed.
- Frontend TypeScript typecheck passed.

## Known Follow-ups

- Manual QA scenarios T073-T082 remain to be executed and recorded.
- Merge readiness task T087 is pending branch/process confirmation.
