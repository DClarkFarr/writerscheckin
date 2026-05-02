# Feature Specification: Group Actions UI

**Feature Branch**: `006-group-actions-ui`  
**Created**: 2026-05-02  
**Status**: Draft  
**Input**: User description: "As a group admin or owner, I should see options to edit or perform actions on groups. As a member, instead of the edit button, there should be a view button with an eye icon. Instead of the actions to edit group or deactivate group (admin actions), I should have the option to leave the group. When clicking on the view/eye icon, I should see a summary of the group, including: name, description, recurrence, time, the owner, a list of members (active members only)"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Admin/Owner Group Actions (Priority: P1)

As a group admin or owner, I need a clear way to manage the groups I own so that I can maintain group settings and control group membership.

**Why this priority**: Core functionality for group administrators to control group settings and lifecycle. This is foundational for the role-based UI.

**Independent Test**: Can be tested by logging in as a group owner, navigating to a group, and verifying edit and deactivation action buttons are visible and functional.

**Acceptance Scenarios**:

1. **Given** I am logged in as a group owner, **When** I view the group in the groups list or group details, **Then** I see an "Edit" button or icon for modifying group settings
2. **Given** I am logged in as a group admin, **When** I view the group, **Then** I see options to manage group membership and group settings (e.g., deactivate group)
3. **Given** I click the edit button, **When** the action is triggered, **Then** I am taken to the group edit interface or form
4. **Given** I am viewing a group I own, **When** I see the deactivation option, **Then** the action is clearly labeled and accessible

---

### User Story 2 - Member Group View & Leave (Priority: P1)

As a group member (non-admin), I need to view group details and leave the group, but I should not see edit or deactivation options.

**Why this priority**: Equally core - members need a different experience than admins. This defines the contrasting UI for non-admin users.

**Independent Test**: Can be tested by logging in as a regular group member, navigating to a group, and verifying a "View" button (eye icon) is visible instead of edit options, and a "Leave" button is available.

**Acceptance Scenarios**:

1. **Given** I am logged in as a group member, **When** I view the group in the groups list, **Then** I see a "View" button with an eye icon instead of an edit button
2. **Given** I am a member of a group, **When** I look at the group actions, **Then** I do NOT see edit or deactivation options
3. **Given** I am a member of a group, **When** I view the group actions, **Then** I see a "Leave Group" button or option
4. **Given** I click the leave group button, **When** the action is triggered, **Then** I am removed from the group membership and receive confirmation

---

### User Story 3 - Group Summary View (Priority: P1)

As a group member or owner, when I click the view/eye icon or summary link, I should see key information about the group in a modal or dedicated view.

**Why this priority**: Core functionality that all users need - viewing group details. The summary must display relevant meeting and membership information.

**Independent Test**: Can be tested by clicking the view button and verifying all required information (name, description, recurrence, time, owner, active members list) is displayed correctly.

**Acceptance Scenarios**:

1. **Given** I click the view button (eye icon), **When** the view loads, **Then** I see the group name displayed prominently
2. **Given** I am viewing the group summary, **When** the view loads, **Then** I see the group description
3. **Given** I am viewing the group summary, **When** the view loads, **Then** I see the meeting recurrence pattern (e.g., weekly, bi-weekly)
4. **Given** I am viewing the group summary, **When** the view loads, **Then** I see the meeting time
5. **Given** I am viewing the group summary, **When** the view loads, **Then** I see the group owner's name or identifier
6. **Given** I am viewing the group summary, **When** the view loads, **Then** I see a list of active members (excluding deactivated/inactive members)
7. **Given** the group has multiple active members, **When** I view the summary, **Then** all active members are displayed in the list
8. **Given** the group has deactivated members, **When** I view the summary, **Then** only active members appear in the member list

---

### Edge Cases

- What happens when a user is viewing the UI and their role changes (e.g., they are promoted to admin)? Should the UI refresh automatically?
- How is the member list sorted or paginated if there are many members?
- What happens if the group has no description? Should an empty state be shown or a placeholder?
- Can a group owner remove themselves from a group, or must they deactivate the group first?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display role-specific actions based on user's role in the group (owner/admin vs member)
- **FR-002**: Group owners and admins MUST see an "Edit" button or action for modifying group settings
- **FR-003**: Group owners and admins MUST see a deactivation/management action for the group
- **FR-004**: Regular members MUST see a "View" button with an eye icon instead of an edit button
- **FR-005**: Regular members MUST NOT see edit or deactivation options for the group
- **FR-006**: Regular members MUST see a "Leave Group" button or action
- **FR-007**: When a user clicks the view button, the system MUST display a group summary modal or dedicated view
- **FR-008**: The group summary MUST display the group name
- **FR-009**: The group summary MUST display the group description
- **FR-010**: The group summary MUST display the meeting recurrence pattern
- **FR-011**: The group summary MUST display the meeting time
- **FR-012**: The group summary MUST display the group owner's name or identifier
- **FR-013**: The group summary MUST display a list of active members only (excluding inactive/deactivated members)
- **FR-014**: The leave group action MUST remove the user from the group membership
- **FR-015**: The leave group action MUST display a confirmation or success message to the user

### Key Entities

- **Group**: Represents a group with properties including name, description, recurrence, meeting time, owner, and active/inactive members
- **GroupMember**: Represents a user's membership in a group with a role (owner, admin, member) and status (active, inactive)
- **User**: Represents a person with ability to own or join groups

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of group owners and admins see the edit button when viewing their groups
- **SC-002**: 0% of regular members see edit or deactivation options on groups they don't own or admin
- **SC-003**: 100% of regular members see the view button (eye icon) when viewing groups
- **SC-004**: 100% of group summary views display all required information (name, description, recurrence, time, owner, active members list)
- **SC-005**: Users can successfully leave a group with a single action and receive confirmation
- **SC-006**: The group summary view loads in under 1 second for typical group sizes (up to 100 members)
- **SC-007**: Role-based UI rendering is consistent across all group list views and group detail pages

## Assumptions

- Users already have established roles within groups (owner, admin, member) defined in the data model
- Active members are distinguished from inactive members by a status flag or deletion marker
- The group edit interface is already implemented and only needs to be referenced from the new action button
- The existing group deactivation functionality can be accessed via the new action button
- Users expect standard UI patterns: eye icon for view, pencil for edit, exit icon or label for leave
- Modal or dedicated view is the appropriate UI pattern for displaying group summary (not inline expansion)
- Member lists of up to 500 members should be supported without pagination concerns in v1
