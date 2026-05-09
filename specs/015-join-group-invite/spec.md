# Feature Specification: Join Group Invite

**Feature Branch**: `[015-add-group-invite-actions]`  
**Created**: 2026-05-08  
**Status**: Draft  
**Input**: User description: "as a user, when i get the join group email, i should be able to click the link, view the group details and join or decline.

The join group page should be accessible without being logged in.

## Decline

The decline button will work whether logged in or not. When clicked, there will be a confirmation dialog modal, and then the invite view will update indicating

## Accept

If not logged in, a modal will popup with a login form. Upon login complete, automatically accept and redirect to the home page.

If logged in, accept and redirect as above."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Open Invite From Email (Priority: P1)

As an invited user, I can open the join-group link from my email and view the invitation details even when I am not signed in.

**Why this priority**: Access to the invite page is the entry point for all downstream actions and must work before authentication decisions.

**Independent Test**: Can be fully tested by opening a valid invite link in a signed-out session and verifying the invite details page renders without requiring prior login.

**Acceptance Scenarios**:

1. **Given** a valid email invite link, **When** the invited user opens the link while signed out, **Then** the join-group page loads and displays invitation details.
2. **Given** a valid email invite link, **When** the invited user opens the link while signed in, **Then** the same invitation details are displayed.

---

### User Story 2 - Decline Invite Anywhere (Priority: P1)

As an invited user, I can decline an invitation whether signed in or signed out, with a confirmation step to prevent accidental decline.

**Why this priority**: Users need a safe and explicit way to refuse membership without forcing sign-in.

**Independent Test**: Can be fully tested by declining from the invite page in both signed-in and signed-out states, confirming the modal, and verifying the page state updates to declined.

**Acceptance Scenarios**:

1. **Given** an invite is displayed, **When** the user selects Decline, **Then** a confirmation modal is shown before the decline is finalized.
2. **Given** the confirmation modal is open, **When** the user confirms decline, **Then** the invite is marked declined and the invite view updates to show the invitation has been declined.
3. **Given** the confirmation modal is open, **When** the user cancels, **Then** no decline is performed and the invite remains actionable.

---

### User Story 3 - Accept Invite And Continue (Priority: P1)

As an invited user, I can accept an invite and be redirected to the home page; if I am signed out, the flow prompts me to log in and then completes acceptance automatically.

**Why this priority**: Joining the group is the primary value outcome of the email invite flow.

**Independent Test**: Can be fully tested by accepting as a signed-in user, then repeating as a signed-out user who completes login from the modal, and verifying automatic acceptance and home-page redirect in both cases.

**Acceptance Scenarios**:

1. **Given** a signed-in invited user on the invite page, **When** they select Join Group, **Then** the invite is accepted and they are redirected to the home page.
2. **Given** a signed-out invited user on the invite page, **When** they select Join Group, **Then** a login modal is displayed.
3. **Given** a signed-out invited user completes login from the modal, **When** authentication succeeds, **Then** the original invite is accepted automatically and the user is redirected to the home page.

### Edge Cases

- The invite link is invalid, expired, or already consumed; the page shows a clear non-actionable state and does not offer Join or Decline actions.
- The user closes the login modal during accept flow; no acceptance occurs and the invite remains pending.
- The user confirms decline but the operation fails; the page keeps the invite actionable and presents a clear retry message.
- The invite is already declined or accepted from another session; refreshing or re-opening the link shows the current final status.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to open a join-group invite page from an email link without requiring an active session.
- **FR-002**: System MUST display invitation details on the join-group page for both signed-in and signed-out users when the invite is valid.
- **FR-003**: System MUST provide a Decline action on the invite page regardless of authentication state.
- **FR-004**: System MUST require confirmation in a modal before finalizing decline.
- **FR-005**: System MUST mark the invite as declined after confirmation and update the invite page to indicate the invitation has been declined.
- **FR-006**: System MUST provide a Join Group action on the invite page when the invite is valid and pending.
- **FR-007**: System MUST accept the invite immediately and redirect to the home page when a signed-in user selects Join Group.
- **FR-008**: System MUST display a login modal when a signed-out user selects Join Group.
- **FR-009**: System MUST automatically continue the original acceptance flow after successful login from the modal and then redirect to the home page.
- **FR-010**: System MUST prevent Join Group and Decline actions for invalid, expired, or already-resolved invites and present the current invite status.
- **FR-011**: System MUST provide user-facing error feedback when accept or decline cannot be completed.

### Key Entities _(include if feature involves data)_

- **Email Invite Link**: A shareable link sent by email that identifies a specific pending invitation and opens its join-group page.
- **Group Invitation**: The invitation record containing invite status (pending, accepted, declined, invalid/expired) and group details displayed to the user.
- **Invite Action Session State**: The user state at action time (signed in or signed out) used to determine whether to execute acceptance immediately or require login first.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of valid invite links used in acceptance testing open an invitation details page without requiring pre-login.
- **SC-002**: 95% of invited users in test sessions complete either Join Group or Decline in under 60 seconds from page load.
- **SC-003**: 100% of confirmed decline actions update the invite view to a declined state immediately after completion.
- **SC-004**: 100% of successful signed-in Join Group actions redirect users to the home page.
- **SC-005**: 100% of successful signed-out Join Group flows that complete login automatically complete invite acceptance and redirect to the home page in the same flow.

## Assumptions

- Invite links uniquely identify one invitation and can be validated by existing invitation records.
- The home page route already exists and is the intended post-accept destination for this flow.
- Login in the modal uses existing authentication behavior and preserves enough context to resume the original invite acceptance action.
- Invite detail fields (for example, group name and relevant meeting context) are already available through existing group/invite domain data.
