# Feature Specification: Meeting Invite Link Status

**Feature Branch**: `[018-improve-invite-link-behavior]`  
**Created**: 2026-05-13  
**Status**: Draft  
**Input**: User description: "As a user opening an email meeting invite for a group I have not joined yet, show status-specific guidance and actions instead of a generic forbidden error, while always showing group name and description."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Status-Aware Invite Landing (Priority: P1)

As an invitee opening a meeting link from email, I can see clear status-specific messaging and the group context so I understand why access is limited and what to do next.

**Why this priority**: The current experience fails at first contact and blocks comprehension with a generic error.

**Independent Test**: Can be fully tested by opening the same meeting-link experience with multiple membership statuses and verifying the page renders contextual guidance without an unhandled forbidden screen.

**Acceptance Scenarios**:

1. **Given** a user opens a meeting invite link from email and is invited but has not joined the group, **When** the page loads, **Then** the user sees the group name, group description, and message that they must accept the invitation to continue.
2. **Given** a user opens the link and has no invite, **When** the page loads, **Then** the user sees the group name, group description, and a message that they are not currently invited.
3. **Given** a user opens the link and was previously declined, left, or removed, **When** the page loads, **Then** the user sees status-appropriate explanation text and available next action options.

---

### User Story 2 - Accept Or Decline From Invite State (Priority: P2)

As an invited but not-yet-joined user, I can accept or decline directly from the invite landing state so I can resolve access without leaving the flow.

**Why this priority**: This is the fastest path from blocked access to valid participation.

**Independent Test**: Can be fully tested by opening a pending-invite link, selecting accept and decline in separate runs, and verifying each decision produces the expected post-action state.

**Acceptance Scenarios**:

1. **Given** a user has a pending invite, **When** the user chooses Accept, **Then** membership is activated and the user can proceed to meeting access in the same flow.
2. **Given** a user has a pending invite, **When** the user chooses Decline, **Then** the user remains outside the group and sees confirmation of the decline outcome.

---

### User Story 3 - Rejoin Request For Declined Or Removed Users (Priority: P3)

As a user who declined, left, or was removed, I can request to join again so an admin can reinvite me.

**Why this priority**: It preserves recovery paths for legitimate users who return after prior state changes.

**Independent Test**: Can be fully tested by loading the page in declined/removed states, selecting Request to join, and verifying a request notification is sent to the responsible group admin with requester identity.

**Acceptance Scenarios**:

1. **Given** a user previously declined or was removed, **When** the user views the invite landing page, **Then** the page explains they can contact the group owner and offers a Request to join button.
2. **Given** a user selects Request to join, **When** the request is submitted, **Then** an email is sent to the responsible group admin that includes the requester's email and the referenced group/meeting context.

---

### Edge Cases

- The meeting link is valid but points to a canceled or inaccessible meeting; the user still receives a clear status message and group context.
- A user opens an old invite after already becoming an active member; the experience should skip blocked-state messaging and continue with normal access.
- A user rapidly refreshes the invite page; repeated system retries should not create duplicate red-error states for known authorization outcomes.
- The responsible admin email is unavailable; the request-to-join action should show a clear fallback message and avoid silently failing.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST resolve and present a user-facing invite status when an email meeting link is opened by a non-active group member.
- **FR-002**: System MUST support distinct outcomes at minimum for: invited but not accepted, not invited, declined/left, removed, and unknown/expired eligibility.
- **FR-003**: System MUST always display the target group's name and description for all resolved outcomes in FR-002.
- **FR-004**: System MUST replace generic forbidden error surfacing on this flow with status-specific explanatory messaging.
- **FR-005**: System MUST provide Accept and Decline actions for users in invited-but-not-accepted status.
- **FR-006**: System MUST update the user's status immediately after Accept or Decline and render the resulting state without requiring a separate manual navigation flow.
- **FR-007**: System MUST provide guidance text for declined/left/removed outcomes that instructs the user to contact the group owner for reinvitation.
- **FR-008**: System MUST provide a Request to join action for declined/left/removed outcomes.
- **FR-009**: System MUST send a join-request email to the responsible group admin when Request to join is submitted.
- **FR-010**: System MUST include the requester's email address and relevant group/meeting identity in the join-request email.
- **FR-011**: System MUST prevent repeated automatic retries that surface multiple consecutive forbidden states for known authorization outcomes in this flow.
- **FR-012**: System MUST present a clear failure message when join-request notification delivery cannot be completed.

### Key Entities _(include if feature involves data)_

- **Invite Link Access State**: The resolved relationship between user and group when opening a meeting invite link (pending invite, not invited, declined/left, removed, active member, unknown).
- **Invite Landing Context**: Display data shown regardless of eligibility state, including group name, group description, and meeting reference.
- **Membership Decision Action**: User decision from pending invite state (accept or decline) that changes eligibility outcome.
- **Join Request**: A user-submitted request to be invited again, containing requester identity and target group/meeting context.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of tested invite-link visits for non-active members render a status-specific message instead of a generic forbidden error page.
- **SC-002**: 100% of tested invite-link outcomes display both group name and group description.
- **SC-003**: At least 95% of invited-but-not-joined users complete accept or decline in under 30 seconds from page load.
- **SC-004**: At least 95% of join-request submissions for declined/removed users generate a corresponding admin notification with requester email and target context.
- **SC-005**: User-reported confusion tickets for invite-link access errors decrease by at least 60% within one release cycle after launch.

## Assumptions

- The invite-link user is already authenticated or can be reliably identified before status resolution is shown.
- A single responsible group admin recipient exists for join-request notifications at send time.
- The same invite landing experience can be used for both group-level and meeting-context status messaging.
- Existing membership status records can distinguish pending invite, declined/left, removed, and active states.
