# Quickstart: Group Meeting Models

## Goal

Implement model-layer data structures and basic CRUD methods for groups, memberships, meetings, attendee state, and attendance logs, following existing `express/src/models` patterns.

## Prerequisites

- Branch: `003-add-model-crud`
- Backend dependencies installed:
  - `cd express && npm install`
- MongoDB configured in local env.

## Implementation Steps

1. Register collection names

- Update `express/src/models/collections.ts` with:
  - `groups`
  - `groupMembers`
  - `groupMeetings`
  - `meetingAttendees`
  - `meetingAttendanceLogs`

2. Add model files following existing conventions

- Create files:
  - `express/src/models/groups.ts`
  - `express/src/models/groupMembers.ts`
  - `express/src/models/groupMeetings.ts`
  - `express/src/models/meetingAttendees.ts`
  - `express/src/models/meetingAttendanceLogs.ts`
- In each file include:
  - `Definition`, `Blueprint`, `Document` types
  - collection accessor
  - `ensure...Indexes()`
  - create/get/list/update/delete-style CRUD methods
  - timestamp helper usage (`createTimestamps`, `touchTimestamps`)
  - object id coercion (`ensureObjectId`) for referenced IDs

3. Apply model-level validation guards

- Enforce 15-minute increments for meeting start minutes and duration.
- Enforce duration range `60-240` minutes.
- Enforce enum constraints for roles and statuses.
- Enforce owner uniqueness for active group membership writes.

4. Implement soft-delete behavior

- Add `deletedAt` in Group, GroupMember, GroupMeeting models.
- Make default reads exclude deleted rows.
- Implement soft-delete update methods to set `deletedAt` + `updatedAt`.

5. Implement attendance logging behavior

- Ensure attendee creation/change operations append `MeetingAttendanceLog` rows.
- Set `notificationSent` default to `false`.
- Expose update method for cron/worker flow to mark logs as notified.

## Validation

### Static checks

- `cd express && npm run build`

### Manual model checks

1. Group CRUD

- Create group with valid schedule and recurrence.
- Read/list group; verify defaults present.
- Update group fields; verify `updatedAt` changes.
- Soft delete group; verify excluded from default reads.

2. GroupMember CRUD

- Add owner/member/admin rows.
- Verify only one active owner per group.
- Update invite status through valid transitions.
- Reject invalid transitions.

3. GroupMeeting CRUD

- Create draft meeting from group snapshot defaults.
- Publish meeting and verify status update.
- Soft delete meeting and verify default read exclusion.

4. MeetingAttendee + Logs

- Create attendee rows for meeting members.
- Update attendee status and confirm corresponding log rows are appended.
- Mark log notifications as sent and verify field updates.

## Definition of Done

- New model files compile in strict TypeScript mode.
- CRUD methods exist for all five entities.
- Soft-delete default filtering is implemented where required.
- Schedule/duration and enum validations are enforced.
- Attendance log append behavior is verifiable from model operations.

## Implementation Progress Notes

- Phase 1 and Phase 2 scaffolding completed:
  - Added shared model helpers in `express/src/models/groupModelCommon.ts`.
  - Registered new collections in `express/src/models/collections.ts`.
  - Added index bootstrap wiring in `express/src/models/ensureIndexes.ts` and `express/src/server.ts`.
  - Added model files for `groups`, `groupMembers`, `groupMeetings`, `meetingAttendees`, and `meetingAttendanceLogs`.
- User Story 1 implementation started and completed for model-layer CRUD in `express/src/models/groups.ts`.

### Manual Verification Notes: Group CRUD (US1)

1. Create a group with:
   - valid `startTime.minutes` in `{0, 15, 30, 45}`
   - valid `durationMinutes` in `60..240`, divisible by 15
   - valid recurrence (`weekly` or `biweekly`) and at least one day in `daysOfWeek`
2. Read via `getGroupById()` and `listGroups()` and verify created fields + timestamps.
3. Update with `updateGroupById()` and verify `updatedAt` is set and changed fields persist.
4. Soft-delete with `softDeleteGroupById()` and verify default read/list methods omit deleted records.

### Manual Verification Notes: Group Members + Invites (US2)

1. Create initial owner membership with `createGroupMember()` and verify write succeeds.
2. Attempt to create a second active owner in same group and verify owner-uniqueness validation fails.
3. Create admin/member records and verify `listGroupMembersByGroupId()` returns expected active members.
4. Update invite status with `updateGroupMemberById()` using valid transitions only:

- `invited -> accepted`
- `invited -> declined`
- `accepted -> cancelled`

5. Attempt invalid transition (for example `declined -> cancelled`) and verify validation fails.
6. Soft-delete membership with `softDeleteGroupMemberById()` and verify default reads omit deleted member.

### Manual Verification Notes: Meetings + Attendees + Logs (US3)

1. Create meeting with `createGroupMeeting()` and verify status defaults to `draft`.
2. List/read meetings with `listGroupMeetingsByGroupId()` and `getGroupMeetingById()`.
3. Publish with `publishGroupMeetingById()` and verify status changes to `published`.
4. Create attendees with `createMeetingAttendee()` and verify unique `(meetingId, memberId)` constraint.
5. Update attendee status via `updateMeetingAttendeeStatusById()` using a log context.
6. Verify attendance log row is created in `meetingAttendanceLogs` when status changes to `attending`, `reading`, or `skipping`.
7. Verify pending logs via `listPendingAttendanceLogs()` and mark sent via `markMeetingAttendanceLogNotifiedById()` / `markMeetingAttendanceLogsNotified()`.
