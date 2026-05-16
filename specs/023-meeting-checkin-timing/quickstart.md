# Quickstart: Meeting Check-in Timing

## Overview

This feature supports:

- cross-day check-in eligibility based on timestamps
- live second-by-second countdown messaging
- static pre-open button labels
- attendee downgrade-only changes after check-in closes
- admin upgrade-only attendee status changes at any time

Status hierarchy:

- `reading` (highest)
- `attending`
- `skipping` (lowest)

## Implemented Endpoints

- Attendee check-in / post-close downgrade:
  - `POST /groups/meetings/:meetingId/checkin`
- Admin attendee upgrade:
  - `PATCH /groups/meetings/:meetingId/attendees/:memberId/status`

## Implementation Notes

- Attendee updates after close are validated as downgrade-only in `updateMeetingCheckin()`.
- Admin updates are validated as upgrade-only in `adminUpgradeMeetingAttendee()`.
- `meetingAttendees` audit metadata is persisted on updates:
  - attendee downgrade: `changedBy=<attendeeUserId>`, `isAdminOverride=false`
  - admin upgrade: `changedBy=<adminUserId>`, `isAdminOverride=true`
- Meeting detail admin UI listens for `meeting` socket events and invalidates the meeting-view query for real-time refresh.

## Validation Outcomes

### Automated Evidence

- `cd express && npx tsc --noEmit` passed
- `cd web && npx tsc --noEmit` passed

### Scenario Execution Matrix

- T073 Exact close boundary downgrade: pending manual QA
- T074 Attendee downgrade after admin upgrade: pending manual QA
- T075 Concurrent admin upgrades: pending manual QA
- T076 Midnight/client clock transition: pending manual QA
- T077 Cross-day open-window check-in: pending manual QA
- T078 P1 cross-day scenario capture: pending manual QA
- T079 P2 countdown scenario capture: pending manual QA
- T080 P3 static label scenario capture: pending manual QA
- T081 P2 downgrade scenario capture: pending manual QA
- T082 P2 admin upgrade scenario capture: pending manual QA

## How To Run Manual QA

1. Start backend: `cd express && npm run dev`
2. Start frontend: `cd web && npm run dev`
3. Use seeded users for attendee/admin roles in the same group
4. Execute T073-T082 scenarios and record pass/fail evidence in this file
