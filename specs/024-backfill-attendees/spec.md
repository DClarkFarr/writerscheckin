# Feature Specification: Backfill Meeting Attendees

**Feature Branch**: 024-backfill-attendees  
**Created**: May 22, 2026  
**Status**: Draft  
**Input**: User description: "As a user, I should be able to see and interact with meetings that were published before I was invited, or that I accepted the group invite to after publication. Ensure users who join/accept invites/are added after meetings are created or published receive attendee records so meetings appear in My Meetings."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See Previously Published Meetings After Joining (Priority: P1)

As a newly joined group member, I can see already published upcoming meetings in My Meetings even when those meetings were published before I joined.

**Why this priority**: This is the core user-facing failure being reported and directly affects trust in meeting visibility.

**Independent Test**: Publish an upcoming meeting, add a user to the group afterward, then verify the meeting appears in that user's My Meetings without manual intervention.

**Acceptance Scenarios**:

1. **Given** a published upcoming meeting exists and a user is not yet a group member, **When** the user accepts a group invite, **Then** that meeting appears in the user's My Meetings.
2. **Given** a published upcoming meeting exists and a user is added to the group by an admin, **When** membership is confirmed, **Then** that meeting appears in the user's My Meetings.

---

### User Story 2 - Backfill Attendee Records for Late Membership Events (Priority: P1)

As the system, I create missing meeting attendee records when a user joins a group after meetings already exist so meeting participation data is complete.

**Why this priority**: Without attendee backfill, downstream views and actions that depend on attendee data remain inconsistent.

**Independent Test**: Trigger each membership path (invite acceptance, direct join, admin add) after one or more meetings are already published, then verify exactly one attendee record exists per eligible meeting for the new member.

**Acceptance Scenarios**:

1. **Given** a user joins a group with multiple already published eligible meetings, **When** membership becomes active, **Then** attendee records are created for each eligible meeting.
2. **Given** an attendee record already exists for one meeting, **When** backfill runs again for that same user and meeting, **Then** no duplicate attendee record is created.

---

### User Story 3 - Interact With Backfilled Meetings Normally (Priority: P2)

As a newly added member, I can interact with backfilled meetings in the same way as meetings where attendee records were created at publish time.

**Why this priority**: Visibility alone is not enough; users must be able to complete normal meeting actions once the meeting appears.

**Independent Test**: After backfill, open the meeting from My Meetings and complete standard attendee actions (such as response/check-in flows governed by existing rules) to confirm behavior parity.

**Acceptance Scenarios**:

1. **Given** a meeting appears due to attendee backfill, **When** the user opens meeting details, **Then** attendee-specific meeting actions are available according to existing meeting rules.
2. **Given** meeting actions have timing/permission constraints, **When** the user attempts those actions on a backfilled meeting, **Then** the same constraints and outcomes apply as for any other attendee.

### Edge Cases

- A user joins a group with zero eligible meetings; no attendee records are created and no errors are surfaced.
- A user joins a group with many eligible meetings; all eligible meetings are processed and become visible in My Meetings.
- Membership creation and manual attendee creation happen near-simultaneously; the final state still has only one attendee record per user-meeting pair.
- A user leaves and later rejoins the same group; attendee creation remains consistent with existing membership and meeting visibility rules.
- A meeting is no longer eligible for attendee participation under current business rules (for example, canceled or otherwise excluded); backfill does not create attendee rows for ineligible meetings.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST ensure users who become active group members after meetings were published are included in My Meetings for all eligible published meetings in that group.
- **FR-002**: System MUST create missing attendee records when membership becomes active through invite acceptance.
- **FR-003**: System MUST create missing attendee records when membership becomes active through direct group join flows.
- **FR-004**: System MUST create missing attendee records when a group admin adds a user as a member after meetings already exist.
- **FR-005**: System MUST create at most one attendee record per user-meeting pair, even if backfill logic is retried or triggered multiple times.
- **FR-006**: System MUST process all eligible published meetings for the group at the time membership becomes active.
- **FR-007**: System MUST leave existing attendee records unchanged when they already exist for a user-meeting pair.
- **FR-008**: Meetings that appear through backfilled attendee records MUST support the same attendee interactions and constraints as meetings where attendee records were created during normal publication flow.
- **FR-009**: System MUST complete attendee backfill in a way that the user sees eligible meetings in My Meetings without requiring manual refresh workflows outside normal app behavior.
- **FR-010**: System MUST apply existing eligibility rules for which meetings qualify for attendee creation (for example publish state and participation eligibility) and MUST NOT create attendee records for meetings outside those rules.

### Key Entities _(include if feature involves data)_

- **Group Membership**: Represents a user's active relationship to a group, including how and when membership became active.
- **Group Meeting**: Represents a scheduled group meeting and whether it is eligible for attendee participation and My Meetings visibility.
- **Meeting Attendee**: Represents a user's participation row for a specific meeting and is the source of meeting visibility/actions in user-facing views.
- **Membership Activation Event**: Represents the trigger point (invite acceptance, join, admin add) that initiates attendee backfill evaluation.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In test scenarios where users join after publication, 100% of eligible published meetings appear in those users' My Meetings within normal data refresh timing.
- **SC-002**: Across invite acceptance, direct join, and admin add flows, attendee backfill creates records for 100% of eligible meetings.
- **SC-003**: Duplicate attendee records for the same user-meeting pair occur in 0% of backfill validation scenarios, including retried events.
- **SC-004**: At least 95% of newly joined users can open and complete at least one standard attendee interaction on a backfilled meeting on first attempt.
- **SC-005**: User-reported incidents of "joined group but meeting missing from My Meetings" for eligible meetings are reduced by at least 90% after release.

## Assumptions

- My Meetings visibility is driven by attendee participation records.
- Existing meeting eligibility rules already define which published meetings should generate attendee participation for a member.
- This feature targets published meetings that are still eligible for member interaction under current product rules.
- Existing permission, timing, and interaction rules for meeting actions remain unchanged; this feature aligns backfilled attendees with those existing rules.
- Membership activation events (invite acceptance, direct join, admin add) are reliable trigger points for attendee backfill.
