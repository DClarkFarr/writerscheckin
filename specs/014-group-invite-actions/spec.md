# Feature Specification: Group Invite Actions

**Feature Branch**: `[014-group-invite-actions]`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "As a user, i should be able to view, accept, or decline invites to groups.

Requirement:

1. When a use first comes to the home page, if the user has pending invites, there should be a small badge with a count in the 'my groups' tab.

2. When clicking the 'my groups' tab, there should be a card with a 'group invites' heading, and a list of pending invites. Each invite should have the group's name, the address and meeting time, and on the left should be blue and red buttons to accept or decline the invitation. The accept button should say 'Join Group' with a checkmark icon, and the decline button should say, 'Decline' with an x icon.

3. the invites should be sorted by date created.

4. Accepting the invite should take the user to the view group page."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See Pending Invite Count (Priority: P1)

As a signed-in user with pending group invites, I can immediately see how many invites are waiting when I land on the home experience so I know action is needed.

**Why this priority**: This is the first visibility point for invites and drives discovery of the invite workflow.

**Independent Test**: Can be fully tested by loading the home page as users with 0, 1, and multiple pending invites and verifying badge visibility and count behavior on the My Groups tab.

**Acceptance Scenarios**:

1. **Given** a signed-in user has at least one pending group invite, **When** they first load the home page, **Then** the My Groups tab shows a badge with the exact number of pending invites.
2. **Given** a signed-in user has no pending group invites, **When** they first load the home page, **Then** no pending-invite badge is shown on the My Groups tab.

---

### User Story 2 - Review Invite Details (Priority: P1)

As a signed-in user, I can open My Groups and review all pending group invites in one place with enough detail to decide whether to join.

**Why this priority**: Users cannot make informed accept/decline decisions without a dedicated list and invite context.

**Independent Test**: Can be fully tested by opening My Groups with multiple pending invites and verifying the Group Invites card, invite details, sort order, and action buttons.

**Acceptance Scenarios**:

1. **Given** a signed-in user has pending invites, **When** they open the My Groups tab, **Then** they see a Group Invites card listing pending invites.
2. **Given** pending invites are listed, **When** invite rows render, **Then** each row shows group name, address, and meeting time.
3. **Given** pending invites are listed, **When** action controls render for each invite, **Then** the left side includes a blue Join Group button with a checkmark icon and a red Decline button with an X icon.
4. **Given** multiple pending invites exist, **When** they are displayed, **Then** they are ordered by invite creation date.

---

### User Story 3 - Accept Or Decline Invite (Priority: P1)

As a signed-in user, I can accept or decline each pending invite so I can keep my group membership list accurate and current.

**Why this priority**: Invite actions are the core value of the feature and complete the user workflow.

**Independent Test**: Can be fully tested by accepting one invite and declining another, then verifying post-action navigation and list/badge updates.

**Acceptance Scenarios**:

1. **Given** a pending invite in the Group Invites list, **When** the user selects Join Group, **Then** the invite is accepted and the user is taken to that group’s view page.
2. **Given** a pending invite in the Group Invites list, **When** the user selects Decline, **Then** the invite is declined and removed from the pending invite list.
3. **Given** invite actions change pending status, **When** the action completes, **Then** the pending invite count badge and Group Invites list reflect the updated total.

### Edge Cases

- A user receives additional invites while viewing the My Groups tab; badge and list should reflect current pending state after refresh/update.
- A user attempts to accept or decline an invite that was already handled elsewhere; the system should show a clear message and refresh invite state.
- Invite data is partially missing (for example, no meeting time); the invite remains actionable and displays available fields without breaking the list.
- The user has a high number of pending invites; ordering by creation date remains consistent and deterministic.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a pending invite count badge on the My Groups tab when the signed-in user has one or more pending group invites.
- **FR-002**: System MUST hide the pending invite badge when the signed-in user has zero pending group invites.
- **FR-003**: System MUST present a Group Invites card in the My Groups tab whenever pending invites exist.
- **FR-004**: System MUST list each pending invite with group name, address, and meeting time.
- **FR-005**: System MUST provide two actions for each pending invite: a blue Join Group button with a checkmark icon and a red Decline button with an X icon.
- **FR-006**: System MUST sort pending invites by invite creation date in descending order (newest first).
- **FR-007**: System MUST allow users to accept a pending invite by selecting Join Group.
- **FR-008**: System MUST redirect users to the invited group’s view page after a successful invite acceptance.
- **FR-009**: System MUST allow users to decline a pending invite by selecting Decline.
- **FR-010**: System MUST remove declined invites from the pending invite list once decline is successful.
- **FR-011**: System MUST update the pending invite badge count and invites list after each successful accept or decline action.
- **FR-012**: System MUST present a clear user-facing error when an invite action cannot be completed.

### Key Entities _(include if feature involves data)_

- **Group Invite**: A pending invitation linking a user to a group, including creation date, current status (pending/accepted/declined), and display details used in the invite list.
- **Invite Summary**: The aggregate pending-invite count shown on the My Groups tab badge for the signed-in user.
- **Invite Action Result**: The outcome of an accept or decline action, including success/failure state and any resulting navigation or list updates.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of tested users with pending invites see an accurate pending-invite badge count on first home-page load.
- **SC-002**: 100% of tested pending invites in My Groups display required details (group name, address, meeting time) and both action buttons.
- **SC-003**: 95% of users in acceptance testing can accept or decline a pending invite on first attempt without assistance.
- **SC-004**: 100% of successful invite acceptance actions navigate users to the corresponding group view page.
- **SC-005**: 100% of successful invite actions update pending-invite list content and badge count within the same user flow.

## Assumptions

- This feature applies to authenticated users acting on invites addressed to their own account.
- A user’s pending invites are already available from existing group/invite domain data and are limited to invites not previously accepted or declined.
- Sorting by creation date is interpreted as newest invites shown first unless later clarified by product direction.
- Group view pages already exist and can be opened directly after invite acceptance.
