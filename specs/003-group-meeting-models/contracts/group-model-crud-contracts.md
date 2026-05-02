# Group Model CRUD Contracts

## Scope

These contracts define model-layer interfaces for the new group meeting entities. They are internal backend contracts between `services` and `models`, not HTTP route contracts.

## Shared Model Conventions

- Each model file defines:
  - `XxxDefinition extends BaseModelBlueprint`
  - `XxxBlueprint = ModelBlueprint<XxxDefinition>`
  - `XxxDocument = ModelDocument<XxxDefinition>`
- Each model exposes:
  - `getXxxCollection()`
  - `ensureXxxIndexes()`
  - CRUD operations with typed input/output
- IDs accept `string | ObjectId` in method inputs and are normalized via `ensureObjectId`.
- Inserts use `createTimestamps()`; updates use `touchTimestamps()`.

## Entity Contracts

### 1) Groups Model (`groups.ts`)

Required methods:

- `createGroup(input): Promise<GroupDocument>`
- `getGroupById(id): Promise<GroupDocument | null>`
- `listGroups(options?): Promise<GroupDocument[]>`
- `updateGroupById(id, updates): Promise<GroupDocument | null>`
- `softDeleteGroupById(id): Promise<boolean>`

Behavior contract:

- Default read/list methods exclude soft-deleted rows.
- `startTime.minutes` must be in 15-minute increments.
- `durationMinutes` must be 60-240 and divisible by 15.

### 2) Group Members Model (`groupMembers.ts`)

Required methods:

- `createGroupMember(input): Promise<GroupMemberDocument>`
- `getGroupMemberById(id): Promise<GroupMemberDocument | null>`
- `listGroupMembersByGroupId(groupId, options?): Promise<GroupMemberDocument[]>`
- `getGroupOwnerByGroupId(groupId): Promise<GroupMemberDocument | null>`
- `updateGroupMemberById(id, updates): Promise<GroupMemberDocument | null>`
- `softDeleteGroupMemberById(id): Promise<boolean>`

Behavior contract:

- Roles restricted to `owner | admin | member`.
- Invite status restricted to `invited | accepted | declined | cancelled`.
- Write operations enforce one active owner per group.
- Default reads exclude soft-deleted rows.

### 3) Group Meetings Model (`groupMeetings.ts`)

Required methods:

- `createGroupMeeting(input): Promise<GroupMeetingDocument>`
- `getGroupMeetingById(id): Promise<GroupMeetingDocument | null>`
- `listGroupMeetingsByGroupId(groupId, options?): Promise<GroupMeetingDocument[]>`
- `updateGroupMeetingById(id, updates): Promise<GroupMeetingDocument | null>`
- `publishGroupMeetingById(id): Promise<GroupMeetingDocument | null>`
- `softDeleteGroupMeetingById(id): Promise<boolean>`

Behavior contract:

- Status restricted to `draft | published`.
- Meeting retains copied snapshot defaults from parent group at creation.
- Default reads exclude soft-deleted rows.

### 4) Meeting Attendees Model (`meetingAttendees.ts`)

Required methods:

- `createMeetingAttendee(input): Promise<MeetingAttendeeDocument>`
- `getMeetingAttendeeById(id): Promise<MeetingAttendeeDocument | null>`
- `getMeetingAttendeeByMember(meetingId, memberId): Promise<MeetingAttendeeDocument | null>`
- `listMeetingAttendeesByMeetingId(meetingId): Promise<MeetingAttendeeDocument[]>`
- `updateMeetingAttendeeStatusById(id, status): Promise<MeetingAttendeeDocument | null>`

Behavior contract:

- Status restricted to `invited | attending | reading | skipping`.
- Unique attendee identity per `(meetingId, memberId)`.
- Status update flows are append-logged via `meetingAttendanceLogs` model.

### 5) Meeting Attendance Logs Model (`meetingAttendanceLogs.ts`)

Required methods:

- `createMeetingAttendanceLog(input): Promise<MeetingAttendanceLogDocument>`
- `listPendingAttendanceLogs(options?): Promise<MeetingAttendanceLogDocument[]>`
- `markMeetingAttendanceLogNotifiedById(id): Promise<MeetingAttendanceLogDocument | null>`
- `markMeetingAttendanceLogsNotified(ids): Promise<number>`

Behavior contract:

- Log status restricted to `attending | reading | skipping`.
- `notificationSent` defaults to `false`.
- Pending query returns rows with `notificationSent: false` ordered by `createdAt` ascending.

## Index Contracts

Minimum index expectations:

- `groups`: active query support (`deletedAt`), recurrence fields as needed.
- `groupMembers`: `{ groupId: 1, role: 1, deletedAt: 1 }`, plus unique active owner invariant support.
- `groupMeetings`: `{ groupId: 1, status: 1, deletedAt: 1, createdAt: -1 }`.
- `meetingAttendees`: unique `{ meetingId: 1, memberId: 1 }`.
- `meetingAttendanceLogs`: `{ notificationSent: 1, createdAt: 1 }`, plus meeting/member lookup indexes.

## Error/Return Semantics

- `get*` methods return `null` when not found.
- `update*` methods return updated document or `null` when not found.
- `softDelete*` methods return `boolean` success flag.
- Validation failures throw `Error` (or typed error wrappers at service layer).

## Non-Goals

- No HTTP endpoint definitions in this contract.
- No scheduler/cron implementation in this contract.
- No frontend API or UI integration in this contract.
