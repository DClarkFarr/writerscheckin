# Feature Specification: Meeting Auto Publish

**Feature Branch**: `[016-create-feature-branch]`  
**Created**: 2026-05-12  
**Status**: Draft  
**Input**: User description: "As a group owner or admin, i should be able to schedule my meetings, and have them go live. If the occurs date is at noon, and the publish date is 12 hours earlier, then at midnight the following night, the meeting should be published, and all members notified."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Schedule Meeting Go-Live (Priority: P1)

As a group owner or admin, I can set both an occurrence date/time and a publish lead time so the meeting automatically becomes visible before it starts.

**Why this priority**: Scheduling the go-live behavior is the core value of the feature and must work before any notification behavior matters.

**Independent Test**: Can be fully tested by creating a meeting with a future occurrence time and a publish lead time, then verifying the system records a planned publication moment.

**Acceptance Scenarios**:

1. **Given** a group owner/admin is creating a meeting, **When** they set occurrence time to 12:00 and publish lead time to 12 hours, **Then** the meeting is set to publish at 00:00 on the previous calendar boundary in the configured meeting timezone.
2. **Given** a group owner/admin updates an existing scheduled meeting's occurrence time or publish lead time, **When** they save the change, **Then** the planned publication moment is recalculated and replaces the previous one.

---

### User Story 2 - Automatic Publication and Notification (Priority: P2)

As a group member, I receive meeting visibility and notification automatically at the scheduled publication moment without requiring manual owner/admin action.

**Why this priority**: Automatic release and notifications fulfill the operational promise of "set it once and it goes live" and prevent missed manual steps.

**Independent Test**: Can be tested by waiting until the publication moment and verifying the meeting becomes visible to members and each active member receives one notification.

**Acceptance Scenarios**:

1. **Given** a meeting is awaiting publication and the publication moment is reached, **When** the scheduler runs, **Then** the meeting status changes to published and is visible in member meeting lists.
2. **Given** a meeting is published automatically, **When** notification dispatch begins, **Then** all active group members are notified exactly once for that publication event.

---

### User Story 3 - Safe Reschedule and Failure Recovery (Priority: P3)

As a group owner/admin, I can safely reschedule or cancel before publication, and as an operator I can trust that missed scheduler windows recover without duplicate publishing.

**Why this priority**: This protects user trust and prevents incorrect notifications when schedules change or temporary outages happen.

**Independent Test**: Can be tested by rescheduling/canceling meetings before publication and by simulating a delayed scheduler run to verify single, correct publication behavior.

**Acceptance Scenarios**:

1. **Given** a meeting has not been published yet, **When** an owner/admin cancels it, **Then** no future automatic publication or member notification occurs.
2. **Given** the scheduler runs late after the publication moment, **When** it resumes, **Then** the meeting is published once and notifications are sent once.

---

### Edge Cases

- Meeting occurrence time is updated to an earlier time that makes the calculated publication moment fall in the past at save time.
- Group has zero active members at publication time.
- Daylight saving time transitions cause local clock skips or repeats around the publication moment.
- Scheduler process is temporarily unavailable during the exact publication minute and resumes later.
- A member is removed from the group between scheduling and publication time.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow only group owners and group admins to define or update a meeting's occurrence date/time and publish lead time.
- **FR-002**: System MUST calculate a deterministic publication moment from occurrence date/time minus publish lead time using the meeting's configured timezone.
- **FR-003**: System MUST store the calculated publication moment and publication state for each scheduled meeting.
- **FR-004**: System MUST automatically publish meetings once the current time reaches or passes the stored publication moment.
- **FR-005**: System MUST ensure each meeting transitions from scheduled to published at most once.
- **FR-006**: System MUST notify all active group members when a meeting is published automatically.
- **FR-007**: System MUST prevent duplicate member notifications for the same meeting publication event.
- **FR-008**: System MUST recalculate and replace the stored publication moment whenever occurrence date/time or publish lead time changes before publication.
- **FR-009**: System MUST suppress automatic publication and member notifications for meetings canceled before publication.
- **FR-010**: System MUST recover missed publication windows by publishing overdue scheduled meetings on the next scheduler execution.
- **FR-011**: System MUST expose publication status and publish timestamp in meeting detail and meeting list views visible to authorized users.

### Key Entities _(include if feature involves data)_

- **Scheduled Meeting**: Meeting record with lifecycle states (draft/scheduled/published/canceled), occurrence date/time, publication moment, and publication timestamp.
- **Publication Schedule Rule**: Owner/admin-defined rule representing publish lead time relative to occurrence date/time.
- **Publication Event**: Immutable record that a specific meeting publication occurred, including event time and deduplication key used to avoid repeat notifications.
- **Member Notification**: Per-member delivery record tied to a publication event, with recipient, delivery state, and sent timestamp.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 95% of scheduled meetings are published within 1 minute of their configured publication moment over a rolling 30-day period.
- **SC-002**: 99% of automatically published meetings send notifications to all active members within 5 minutes of publication.
- **SC-003**: 100% of meetings publish no more than once per schedule (zero duplicate publication events in audit logs).
- **SC-004**: At least 90% of owners/admins complete meeting scheduling with publish lead-time configuration on their first attempt during usability checks.

## Assumptions

- Owners and admins already have existing permissions to create and edit meetings within their groups.
- Active group membership at publication time determines the notification recipient set.
- Meeting timezone is available from existing group or meeting configuration; if unavailable, the platform default timezone is used consistently.
- Notification delivery uses the platform's existing member-notification channels and does not introduce new channels in this feature.
- Feature scope includes automated scheduling, publication, and notification behavior only; it does not redesign meeting creation UX.
