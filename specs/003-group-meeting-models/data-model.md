# Data Model: Group Meeting Models

## Overview

This feature introduces five new backend entities, each with typed model definitions and CRUD methods in `express/src/models/`. All entities include lifecycle timestamps and soft-delete behavior where required.

## Entity 1: Group

- Purpose: Stores group-level defaults for meeting generation and notifications.
- Primary fields:
  - id
  - name
  - description
  - publishEmailMessage
  - attendanceEmailMessage
  - publishHoursBefore
  - notifyAttendanceHoursBefore
  - address
  - startTime: `{ hours, minutes }`
  - durationMinutes
  - recurrenceRule
  - createdAt
  - updatedAt
  - deletedAt
- Validation rules:
  - `startTime.minutes` must be one of `0, 15, 30, 45`.
  - `durationMinutes` must be 15-minute increments between 60 and 240.
  - `publishHoursBefore` and `notifyAttendanceHoursBefore` must be non-negative.
  - `name` required and non-empty.
- Relationships:
  - One-to-many with GroupMember.
  - One-to-many with GroupMeeting.

## Entity 2: GroupMember

- Purpose: Stores membership, role, and invite lifecycle for users in groups.
- Primary fields:
  - id
  - groupId
  - userId
  - role: `owner | admin | member`
  - invite
  - createdAt
  - updatedAt
  - deletedAt
- Invite subdocument:
  - invitedBy
  - invitedAt
  - invitedUser
  - status: `invited | accepted | declined | cancelled`
  - statusChangedAt
- Validation rules:
  - Exactly one active owner per group.
  - Invite status transitions follow allowed flow constraints.
  - `groupId`, `userId`, `invitedBy`, and `invitedUser` must be valid object ids.
- Relationships:
  - Belongs to Group.
  - Referenced by GroupMeeting and MeetingAttendanceLog.

## Entity 3: GroupMeeting

- Purpose: Stores concrete meeting instances and snapshot defaults copied from Group.
- Primary fields:
  - id
  - groupId
  - name
  - description
  - emailMessage
  - address
  - startTime: `{ hours, minutes }`
  - durationMinutes
  - publishEmailMessage
  - attendanceEmailMessage
  - publishHoursBefore
  - notifyAttendanceHoursBefore
  - status: `draft | published`
  - createdAt
  - updatedAt
  - deletedAt
- Validation rules:
  - `status` must be `draft` or `published`.
  - time/duration constraints match Group constraints.
- Relationships:
  - Belongs to Group.
  - One-to-many with MeetingAttendee.
  - One-to-many with MeetingAttendanceLog.

## Entity 4: MeetingAttendee

- Purpose: Stores each member's current attendance state for a meeting.
- Primary fields:
  - id
  - meetingId
  - memberId
  - status: `invited | attending | reading | skipping`
  - createdAt
  - updatedAt
- Validation rules:
  - One attendee row per `(meetingId, memberId)` pair.
  - Status must be in allowed enum.
- Relationships:
  - Belongs to GroupMeeting.
  - References GroupMember.

## Entity 5: MeetingAttendanceLog

- Purpose: Immutable event log for attendance changes consumed by notification jobs.
- Primary fields:
  - id
  - groupId
  - memberId
  - userId
  - meetingId
  - status: `attending | reading | skipping`
  - notificationSent
  - createdAt
  - updatedAt
- Validation rules:
  - `notificationSent` defaults to `false`.
  - Status must be in allowed enum.
- Relationships:
  - References Group, GroupMember, and GroupMeeting.

## Shared Sub-Entity: RecurrenceRule

- Purpose: Encodes recurrence settings used to generate GroupMeeting rows.
- Fields:
  - frequency: `weekly | biweekly`
  - daysOfWeek: number[] (`0`-`6`)
- Validation rules:
  - At least one valid day must be present.
  - Duplicate days are not allowed.

## State Transitions

### GroupMember Invite Status

1. invited -> accepted
2. invited -> declined
3. accepted -> cancelled

Invalid transitions are rejected.

### GroupMeeting Status

1. draft -> published
2. published -> published (idempotent update)

### MeetingAttendee Status

1. invited -> attending | reading | skipping
2. attending | reading | skipping -> attending | reading | skipping

Every status creation/change appends a new MeetingAttendanceLog row.

## Soft Delete Contract

- Group, GroupMember, and GroupMeeting support soft delete via `deletedAt` timestamp.
- Default reads exclude soft-deleted rows.
- Explicit audit/recovery reads may opt in to deleted records.
- MeetingAttendanceLog remains operationally append-only and is not soft-deleted by default workflows.
