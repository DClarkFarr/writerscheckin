# Feature Specification: Group Member/Admin Management Refactor

**Feature Branch**: `007-group-member-admin-refactor`  
**Created**: May 2, 2026  
**Status**: Draft

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Unified Member/Admin Add Flow (Priority: P1)

Currently, the group creation/edit form has separate "Select Admins" and "Select Members" dropdowns. This creates duplicate work when admins need to manage role assignments. The user needs a single add member flow where they can add a member and then assign their role (admin or member) after selection.

**Why this priority**: This is the core UX improvement that reduces friction. It's the foundational change that enables all other improvements. Without this, users still work with two separate flows.

**Independent Test**: User can add a member through a single flow, then adjust their role afterward. This delivers the core value of reduced complexity without requiring other features.

**Acceptance Scenarios**:

1. **Given** a group creation form with existing single "Add Member" input, **When** user types a name and selects a member, **Then** that member appears in a list with a default role selector (defaulting to "Member") and delete action
2. **Given** a member in the selected list with default "Member" role, **When** user clicks the role selector, **Then** user can change it to "Admin"
3. **Given** multiple members in the selected list, **When** user clicks the add member input again, **Then** they can continue adding more members
4. **Given** a group edit form, **When** user opens the form, **Then** all current members/admins appear in the same unified list with their correct roles assigned

---

### User Story 2 - Smart Member Search (Priority: P1)

The member search should not pre-query (load all users immediately). It should only search when user provides input, matching against partial name or exact email address. This prevents performance issues and improves accuracy.

**Why this priority**: Directly improves user experience and system performance. Invalid partial matches frustrate users and waste resources.

**Independent Test**: Can be tested independently by verifying that search behavior works correctly without relying on member display or invite functionality.

**Acceptance Scenarios**:

1. **Given** the Add Member input is focused and empty, **When** no user has typed anything, **Then** no dropdown appears.
2. **Given** user types "jo", **When** user has only typed 2 characters, **Then** search results appear only if there's a match for full name or email starting with "jo"
3. **Given** user types "john.doe@company.com", **When** user types a complete email, **Then** search returns exact matches first, then partial name matches
4. **Given** user types "John" where there are users named John Smith and John Doe, **When** search completes, **Then** both results appear

---

### User Story 3 - Invite Unknown Email Addresses (Priority: P2)

When a user provides a complete email address that doesn't match any existing user, the system should offer the option to invite that email as a new member (invitee). This allows admins to add people who haven't signed up yet.

**Why this priority**: Enables real-world workflow where admins invite people who aren't yet in the system. High value but secondary to core flow.

**Independent Test**: Can be tested by entering an unknown email and verifying invite option appears, independent of existing member display.

**Acceptance Scenarios**:

1. **Given** user enters "newuser@company.com" which has no matching user account, **When** search results return empty, **Then** an "Invite newuser@company.com" option appears
2. **Given** the "Invite newuser@company.com" option appears, **When** user clicks it, **Then** the email is added to the selected members list as an invitee
3. **Given** an invitee is added to the list, **When** the form is submitted, **Then** the system records this email as a pending invite and sends an invitation email

---

### User Story 4 - Smart Member Display (Priority: P1)

Selected members in the list should display their avatar and name if they're an existing user. If they're an invite (email without user account), display the email address instead. This provides visual clarity about member status.

**Why this priority**: Critical for UX clarity. Users need to distinguish between existing members and invites.

**Independent Test**: Can be tested by adding both existing and invited members, verifying display shows avatar/name vs email appropriately.

**Acceptance Scenarios**:

1. **Given** an existing user has been selected, **When** they appear in the member list, **Then** their avatar (if available) and full name are displayed
2. **Given** an email invite has been added, **When** it appears in the member list, **Then** the email address is displayed (no avatar, since no user account exists)
3. **Given** a member list with mixed existing users and invites, **When** user views the list, **Then** invites are visually distinguishable (e.g., different styling or icon)

---

### User Story 5 - Member Role and Deletion Actions (Priority: P1)

On the left side of each member item in the selected list, there should be two controls: a role selector dropdown (Admin/Member) and a delete button (X). This allows quick adjustments without opening additional dialogs.

**Why this priority**: Core interaction for managing member permissions and list cleanup.

**Independent Test**: Can test role changes and deletion independently; each action should be immediately reflected in the UI.

**Acceptance Scenarios**:

1. **Given** a member in the selected list with "Member" role, **When** user clicks the role selector, **Then** they can select "Admin" or "Member"
2. **Given** user changes a member's role from "Member" to "Admin", **When** the change is made, **Then** the role selector immediately reflects the new value
3. **Given** a member in the selected list, **When** user clicks the delete button (X), **Then** the member is removed from the list immediately
4. **Given** a member has been deleted from the list, **When** form is submitted, **Then** that member is removed from the group or the invite is canceled

---

### Edge Cases

- What happens if user tries to add themselves as a member? → the search should exclude the current user from results; if they try to add themselves, show a message that they're already a member.
- What if user enters an email that matches multiple partial name-based users? → Show all matches; user must be precise
- What if a member is already in the group and user tries to add them again? → Show a message that they're already added and allow user to just adjust role
- What if user deletes a member from the form but then cancels the save? → Member changes are their own calls, so the changes will persist. After a form is created, member information should not be sent to the endpoints.
- What if search returns zero results and input is not a valid email? → No invite option shown; only search results
- What if user has no permission to change a member's role? → Role selector should be disabled with appropriate message

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a single unified input for adding both members and admins instead of separate selects
- **FR-002**: System MUST NOT pre-query the member list; search must only execute when user provides input
- **FR-003**: System MUST match search queries against complete first/last name or complete email address only
- **FR-004**: System MUST return exact email matches with priority, followed by partial name matches
- **FR-005**: When search results are empty and input is a valid email address, system MUST display an "Invite [email]" option
- **FR-006**: When an email invite is selected, system MUST create an invitee record (not requiring existing user account)
- **FR-007**: System MUST display avatar and full name for existing user members
- **FR-008**: System MUST display email address for invited members (pending user account creation)
- **FR-009**: System MUST provide a role selector (Admin/Member) on the left of each selected member item
- **FR-010**: System MUST provide a delete button (X) on the left of each selected member item to remove members
- **FR-011**: System MUST allow role changes to be made and reflected immediately in the UI before form submission
- **FR-012**: System MUST allow member deletion from the form before submission
- **FR-013**: System MUST prevent duplicate member additions (if member already in list, show notification and focus on existing entry)
- **FR-014**: System MUST validate email format before showing invite option
- **FR-015**: System MUST persist member role changes and deletions to the database on form submission

### Key Entities

- **GroupMember**: Represents both pending invites and accepted members for a group
  - Properties: groupId, userId or email, role (admin/member), invitedAt, invitedBy, acceptedAt, status (invited/accepted/declined/cancelled/removed)
  - Relationships: Links to Group, and optionally to User when a user account exists

- **Group**: Represents the group being edited
  - Properties: groupId, name, members (collection of GroupMember)
  - Relationships: Has many GroupMembers

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can add a member and assign their role in 3 or fewer clicks (vs current 4+ clicks with separate dropdowns)
- **SC-002**: Member search returns results within 500ms with no pre-querying overhead
- **SC-003**: 95% of member search queries result in accurate matches (name or exact email)
- **SC-004**: New admins can invite non-registered users via email with 100% delivery of invitations
- **SC-005**: Visual distinction between existing members and invites is clear to 100% of users in user testing
- **SC-006**: Role changes and member deletions are reflected in UI within 100ms
- **SC-007**: Form submission successfully persists all member and role changes to database in 99% of cases (excluding network failures)
- **SC-008**: Duplicate member addition prevention prevents accidental duplicates in 100% of cases

## Assumptions

- Existing email validation service is available for validating invite email addresses
- Avatar display system is already implemented and available for existing users
- User search/lookup API exists and can return results by name or email
- Group edit form uses a controlled component or similar pattern for managing selected members state
- Invitation email sending system is already in place and functional
- User authentication system properly distinguishes between registered users and invites
- No invite workflow/redemption flow needs to be built (that's assumed to exist)
- UI framework supports role selector dropdowns and action buttons with standard accessibility features
