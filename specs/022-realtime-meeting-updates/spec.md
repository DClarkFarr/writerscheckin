# Feature Specification: Real-time Meeting Updates

**Feature Branch**: `022-manage-meeting-notifications`  
**Created**: 2026-05-16  
**Status**: Draft  
**Input**: User description: "As a user, i should get realtime meeting updates through socket IO connection. Group connections have already been setup. Follow that pattern. We'll emit a new 'meeting' event. Because the main memberMeetingAggregationRowToResponse is an aggregate, we'll instead return the relevent documents (groupMeeting, groupMember, and meetingAtendee) separately and let FE convert them into the object as needed. The meeting document can be the same for all user emits, but the attendee and membership need to be scoped by user ID. Research and follow the pattern of socketGroupEmitGroupSummaryItem"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Receive member-scoped meeting updates (Priority: P1)

As an authenticated group-connected member, I receive a real-time `meeting` event whenever a relevant meeting changes, and the event includes only the membership and attendee records that belong to me.

**Why this priority**: This is the core user value: members see immediate meeting updates without refresh while preserving per-member data boundaries.

**Independent Test**: Can be fully tested by connecting two different members to the same group room, triggering a meeting update, and verifying each member receives one event with the same meeting document but different member-scoped membership/attendee documents.

**Acceptance Scenarios**:

1. **Given** two connected members in the same group room, **When** a meeting update is emitted, **Then** both sockets receive a `meeting` event containing the same meeting document and member-scoped membership/attendee documents for each recipient.
2. **Given** a connected socket for a user with no valid membership in the meeting's group, **When** a meeting update is emitted, **Then** no `meeting` payload is sent to that socket.

---

### User Story 2 - Frontend can reconstruct aggregate view model (Priority: P2)

As a frontend consumer, I receive normalized meeting payload data (meeting, membership, attendee) so I can transform it into the existing aggregate shape locally.

**Why this priority**: The backend avoids duplicating aggregate-specific logic while enabling the existing UI data model to stay consistent.

**Independent Test**: Can be fully tested by validating the emitted payload includes all required source documents for frontend mapping and that frontend conversion creates the expected aggregate structure.

**Acceptance Scenarios**:

1. **Given** a meeting update event payload, **When** frontend mapping runs, **Then** the result can be transformed into the same display-ready meeting row shape currently used by meeting views.

---

### User Story 3 - Event pattern consistency with existing group socket flow (Priority: P3)

As a maintainer, I can rely on the meeting socket emitter using the established group summary emission pattern so behavior remains predictable and supportable.

**Why this priority**: Pattern consistency reduces defects, lowers maintenance cost, and speeds up onboarding for future realtime events.

**Independent Test**: Can be fully tested by verifying the meeting emitter uses the same group-room socket selection and per-socket scoped enrichment pattern as existing group summary events.

**Acceptance Scenarios**:

1. **Given** existing group room connection behavior, **When** the meeting emitter runs, **Then** it follows the same socket discovery and per-socket emit strategy as the existing group summary emitter.

### Edge Cases

- A meeting update is triggered while no sockets are connected to the group room; system performs no emit and completes without error.
- A socket exists in the room but lacks a valid authenticated user identifier; that socket is skipped safely.
- A user has group membership but no attendee record for the meeting yet; that socket is skipped for the `meeting` event.
- Multiple sockets exist for the same user (multi-tab); each connected socket receives the user-scoped event.
- Meeting or group-linked records become unavailable between trigger and emit; system skips emission for invalid recipients without failing the overall operation.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a realtime `meeting` socket event for group-connected users when a relevant meeting update occurs.
- **FR-002**: System MUST target sockets connected to the updated meeting's group room using the established group socket connection pattern.
- **FR-003**: System MUST emit a payload containing three document segments: meeting document, recipient-scoped membership document, and recipient-scoped attendee document.
- **FR-004**: System MUST use the same meeting document for all recipients of the same emitted update.
- **FR-005**: System MUST resolve membership and attendee segments per recipient user identity before emit.
- **FR-006**: System MUST NOT emit meeting payload data to sockets whose users do not have a valid membership in the meeting's group.
- **FR-007**: System MUST preserve compatibility with frontend reconstruction of the aggregate meeting row shape from emitted normalized documents.
- **FR-008**: System MUST skip emission for recipients missing attendee records for the meeting without failing the overall event operation.
- **FR-009**: System MUST complete safely when no eligible sockets are connected, without producing runtime errors.
- **FR-010**: System MUST follow the existing group summary emitter flow for socket lookup, per-socket enrichment, and scoped emission strategy.

### Key Entities _(include if feature involves data)_

- **Meeting Socket Payload**: Realtime event payload containing a group meeting document shared across recipients plus recipient-scoped membership and attendee documents.
- **Group Meeting Document**: Canonical meeting state snapshot for the emitted update, identical for all recipients of that update.
- **Group Membership Document**: Membership record for the receiving user within the meeting's group, used to scope authorization and membership context.
- **Meeting Attendee Document**: Attendance/check-in record for the receiving user for the emitted meeting, nullable when not yet created.
- **Connected Socket Recipient**: Authenticated socket session joined to the meeting's group room and eligible for user-scoped payload enrichment.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of eligible connected members in a group room receive a `meeting` event within 2 seconds of an update trigger under normal operating load.
- **SC-002**: 0 events are delivered to sockets without a valid membership in the meeting's group during verification tests.
- **SC-003**: In multi-user test runs, 100% of recipients receive the same meeting document while recipient-scoped membership/attendee segments match the authenticated receiving user.
- **SC-004**: Frontend reconstruction tests show at least 95% first-pass success converting emitted normalized payloads into the existing aggregate meeting view model without additional API fetches.

## Assumptions

- Group socket room join/leave behavior is already implemented and remains unchanged for this feature.
- Meeting updates that should trigger emits are already identified by existing meeting lifecycle operations; this feature focuses on payload emission behavior.
- Authenticated socket sessions provide a stable user identifier suitable for recipient-scoped membership and attendee lookup.
- Frontend will own final transformation from normalized emitted documents into its aggregate meeting UI model.
- No additional user-facing configuration is required to opt into realtime meeting events for connected members.
