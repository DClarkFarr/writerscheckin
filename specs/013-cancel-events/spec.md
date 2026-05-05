# Feature Specification: Cancel Published Meetings

**Feature Branch**: `[013-cancel-events]`  
**Created**: 2026-05-05  
**Status**: Draft  
**Input**: User description: "as an admin, I should be able to cancel events. Wherever there is an option to publish a draft-status event, there should be an option to cancel a published event. For MeetingFeedItem, it is in the dropdown list. From the meeting form, it replaces the publish card. Cancel meeting UI should prompt a confirmation dialog with an explanation that all RSVP'd members will be notified."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Cancel From Existing Action Points (Priority: P1)

As a group admin, I can cancel a published meeting from the same places where publishing is currently offered so I can quickly stop a meeting that should no longer happen.

**Why this priority**: This is the core business action requested, and it must be available in both known admin entry points to avoid inconsistent behavior.

**Independent Test**: Can be fully tested by opening an upcoming published meeting in each entry point (feed item dropdown and meeting form) and confirming a cancel action is available and executable.

**Acceptance Scenarios**:

1. **Given** an admin viewing an upcoming published meeting in the meetings feed, **When** they open the item actions dropdown, **Then** they can choose a cancel action.
2. **Given** an admin viewing an upcoming published meeting in the meeting form, **When** meeting-level actions are shown, **Then** a cancel option appears in place of the publish card.
3. **Given** a meeting that is not published, **When** an admin views meeting actions, **Then** cancel is not shown as an available action.

---

### User Story 2 - Confirm Intent Before Canceling (Priority: P2)

As a group admin, I must explicitly confirm cancellation after seeing the impact warning so I do not accidentally cancel a meeting.

**Why this priority**: Cancellation is high-impact and should require clear acknowledgment before completion.

**Independent Test**: Can be fully tested by initiating cancel, verifying the confirmation dialog content, and validating outcomes for both confirm and dismiss.

**Acceptance Scenarios**:

1. **Given** an admin chooses cancel for a published meeting, **When** the system prompts for confirmation, **Then** the dialog explains that all RSVP'd members will be notified.
2. **Given** the confirmation dialog is open, **When** the admin dismisses or closes it, **Then** no cancellation occurs.
3. **Given** the confirmation dialog is open, **When** the admin confirms cancellation, **Then** the meeting is canceled and the UI reflects the updated meeting state.

---

### User Story 3 - Preserve Clarity After Cancellation (Priority: P3)

As a group admin, I can clearly see that a meeting has been canceled and no longer exposes contradictory actions.

**Why this priority**: Clear post-action state reduces confusion and prevents repeated or invalid actions.

**Independent Test**: Can be tested by canceling a meeting and verifying the feed/form no longer show cancellation as available for that now-canceled item.

**Acceptance Scenarios**:

1. **Given** a meeting has been canceled, **When** the admin revisits the feed or form actions, **Then** cancel is no longer presented as an available action.
2. **Given** cancellation succeeds, **When** the admin continues using the meetings view, **Then** displayed meeting status remains consistent with cancellation.

### Edge Cases

- An admin attempts to cancel a meeting that was already canceled in another session.
- A meeting changes from published to another state between dialog open and confirmation.
- The cancellation request fails after confirmation; the admin must receive clear failure feedback and keep the original meeting state.
- A non-admin user views the same meeting; cancellation controls must not appear.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow authorized admins to initiate cancellation for published meetings from the feed-item actions dropdown.
- **FR-002**: System MUST show cancellation in the meeting form in the same action location where publish is currently presented for eligible meetings.
- **FR-003**: System MUST require an explicit confirmation step before finalizing cancellation.
- **FR-004**: System MUST display confirmation copy that states all RSVP'd members will be notified when cancellation is confirmed.
- **FR-005**: System MUST complete cancellation only when the admin confirms the dialog; dismissing the dialog MUST leave the meeting unchanged.
- **FR-006**: System MUST update visible meeting state after successful cancellation so admins do not see stale published-action controls.
- **FR-007**: System MUST prevent cancellation controls from appearing for users without cancellation permission.
- **FR-008**: System MUST prevent duplicate cancellation submissions while a cancellation request is already in progress.
- **FR-009**: System MUST present clear user-facing feedback when cancellation cannot be completed.

### Key Entities _(include if feature involves data)_

- **Meeting**: A scheduled event with lifecycle state values including published and canceled, plus metadata used to determine which actions are available.
- **Cancellation Action Context**: User-meeting permission and status context that determines whether cancel can be initiated.
- **Cancellation Confirmation**: The explicit user acknowledgment step that includes impact messaging about RSVP notifications.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of tested eligible published meetings show a cancel action in both required admin entry points.
- **SC-002**: 100% of tested cancellation attempts require confirmation before meeting state changes.
- **SC-003**: 95% of admins in acceptance testing successfully cancel an eligible meeting on the first attempt.
- **SC-004**: 0 critical defects are reported where non-admin users can see or execute cancellation actions.

## Assumptions

- Existing meeting lifecycle states and permission rules remain in place, and this feature adds cancellation entry points aligned with those rules.
- Notification delivery to RSVP'd members is already supported by existing system behavior when a cancellation is processed.
- This scope covers admin-facing cancel controls and confirmation behavior only; it does not redesign broader meeting status workflows.
- Existing meeting views already have a way to present updated status after actions, and cancellation will use the same refresh/update expectations.
