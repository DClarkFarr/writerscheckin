# Feature Specification: Group Meeting Models

**Feature Branch**: `003-add-model-crud`  
**Created**: 2026-05-01  
**Status**: Draft  
**Input**: User description: "Let's specify the data structures we need by creating models with basic CRUD methods, following existing model definition patterns."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configure Group Defaults (Priority: P1)

As an owner or admin, I can create and update a group with scheduling, messaging, and location defaults so recurring meetings can be generated consistently and members receive the correct communications.

**Why this priority**: Group configuration is the foundation for all meeting and attendance workflows.

**Independent Test**: Create a group with all default scheduling and notification settings, retrieve it, update selected fields, and verify the latest values are returned while historical timestamps remain consistent.

**Acceptance Scenarios**:

1. **Given** a signed-in owner creates a group with valid schedule, duration, and notification settings, **When** the group is saved, **Then** the group is persisted with timestamps and active status.
2. **Given** an existing active group, **When** an owner or admin updates description, reminder messages, or schedule settings, **Then** the updated fields are stored and reflected on subsequent reads.
3. **Given** a deleted group, **When** standard group queries run, **Then** the deleted record is excluded by default.

---

### User Story 2 - Manage Membership and Invites (Priority: P1)

As an owner or admin, I can add and manage members with roles and invite statuses so group permissions and participation are controlled.

**Why this priority**: Membership and role controls are required before meetings can be coordinated effectively.

**Independent Test**: Add users to a group with role and invite metadata, transition invite statuses through valid states, and verify owner uniqueness and role-based constraints.

**Acceptance Scenarios**:

1. **Given** a group with an owner, **When** an admin adds a new member invite, **Then** the membership record stores inviter, invited user, status, and status timestamp.
2. **Given** a member invite in invited state, **When** it is accepted or declined, **Then** the status and status change timestamp are updated.
3. **Given** an owner transfer request, **When** a new owner is designated, **Then** the group has exactly one owner membership record.

---

### User Story 3 - Track Meetings and Attendance State (Priority: P2)

As a member, I can see meeting attendee status and update my response, while the system logs attendance changes for notification processing.

**Why this priority**: Attendance tracking delivers the operational value of meetings after group and membership setup exists.

**Independent Test**: Create a meeting from group defaults, initialize attendee rows for current members, change attendee status multiple times, and confirm corresponding attendance logs are created and can later be marked notified.

**Acceptance Scenarios**:

1. **Given** a generated meeting, **When** meeting records are initialized, **Then** attendee rows are created for each current group member with default invited status.
2. **Given** a member updates attendance from invited to attending, reading, or skipping, **When** the change is saved, **Then** attendee current state is updated and a new attendance log entry is appended.
3. **Given** pending attendance logs, **When** notification processing marks them sent, **Then** notification status changes without altering the original attendance decision.

### Edge Cases

- Group schedule creation rejects invalid time-of-day values that are not in 15-minute increments.
- Group duration rejects values outside 15-minute increments or outside the 1 to 4 hour allowed range.
- Group ownership updates prevent having zero owners or more than one owner in a group.
- Membership status transitions reject invalid state changes (for example, direct transition from declined to cancelled without acceptance).
- Meetings created from group defaults retain snapshot values even if group defaults are changed later.
- Soft-deleted groups, members, and meetings are omitted from default reads but remain available for audit/recovery workflows.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST support create, read, update, and soft-delete operations for groups.
- **FR-002**: Each group MUST store name, description, messaging defaults, publish timing defaults, attendance notification timing defaults, address, meeting start time, duration, recurrence rule, and lifecycle timestamps.
- **FR-003**: Group meeting start time MUST be constrained to hour/minute values where minutes are in 15-minute increments.
- **FR-004**: Group meeting duration MUST be constrained to 15-minute increments between 1 hour and 4 hours inclusive.
- **FR-005**: Group recurrence MUST support at least weekly and biweekly patterns and allow explicit rule details needed to represent day-based scheduling.
- **FR-006**: The system MUST support create, read, update, and soft-delete operations for group memberships.
- **FR-007**: Each group membership MUST store group reference, member reference, role, invite metadata, and lifecycle timestamps.
- **FR-008**: Membership roles MUST include owner, admin, and member; the group MUST always have exactly one owner.
- **FR-009**: Invite metadata MUST capture inviter reference, invited user reference, invite timestamp, current invite status, and status-change timestamp.
- **FR-010**: Invite status values MUST include invited, accepted, declined, and cancelled.
- **FR-011**: The system MUST support create, read, update, and soft-delete operations for group meetings.
- **FR-012**: Group meetings MUST store meeting-specific values for name, description, reminder message, address, start time, duration, publish/attendance messaging settings, publish timing, attendance notification timing, status, and lifecycle timestamps.
- **FR-013**: Group meetings MUST support statuses draft and published.
- **FR-014**: When meetings are generated from group defaults, default fields MUST be copied into the meeting so the meeting remains historically consistent.
- **FR-015**: The system MUST maintain current attendee state per meeting member with statuses invited, attending, reading, and skipping.
- **FR-016**: The system MUST append an attendance log record whenever attendee status is created, changed, or reverted.
- **FR-017**: Each attendance log MUST store group reference, membership reference, user reference, attendance status, notification-sent flag, and lifecycle timestamps.
- **FR-018**: Attendance log notification-sent flag MUST default to false and be updatable to true after downstream notification processing.
- **FR-019**: Standard read operations for all entities MUST exclude soft-deleted records by default.
- **FR-020**: The data model MUST align with existing project conventions for model definitions and basic CRUD method shape.

### Key Entities _(include if feature involves data)_

- **Group**: Represents a recurring meeting container and default configuration. Key attributes include identity, descriptive fields, messaging defaults, scheduling defaults, recurrence rule, address, and lifecycle timestamps.
- **GroupMember**: Represents a user’s relationship to a group. Key attributes include role, invite details, status history timestamp, and lifecycle timestamps.
- **GroupMeeting**: Represents a specific scheduled meeting instance, including meeting-level details and copied defaults from the parent group at creation time.
- **MeetingAttendee**: Represents each member’s current attendance state for a specific meeting.
- **MeetingAttendanceLog**: Represents immutable attendance-state change events used for downstream notifications and auditability.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of required entities (Group, GroupMember, GroupMeeting, MeetingAttendee, MeetingAttendanceLog) support create, read, update, and soft-delete flows with default filtering of deleted records.
- **SC-002**: 100% of attempts to save invalid time increments or invalid duration ranges are rejected with clear validation outcomes.
- **SC-003**: 100% of groups in test scenarios maintain exactly one owner at all times across owner assignment and transfer operations.
- **SC-004**: 100% of attendee status changes in test scenarios produce a corresponding attendance log entry.
- **SC-005**: At least 95% of valid CRUD operations for these entities complete successfully in under 1 second under normal expected load.

## Assumptions

- This feature defines and delivers data structures and CRUD behavior only; notification sending orchestration and UI workflows are handled in separate features.
- Existing authentication and identity references already exist and can be linked by identifier.
- Existing project standards for lifecycle timestamps and soft delete semantics are reused.
- Meetings generated from recurrence rules are created by an existing or future scheduler process outside this feature’s scope.
- Historical consistency is preferred over live inheritance, so meeting records keep copied defaults from the time they are created.
