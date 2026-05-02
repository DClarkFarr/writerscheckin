# Feature Specification: My Groups Tab

**Feature Branch**: `005-create-feature-branch`  
**Created**: 2026-05-02  
**Status**: Draft  
**Input**: User description: "Let's build the my groups tab of the authenticated home page. 1) Users should be able to click My Groups tab and see all the groups they are in. 2) The group list should be paginated by infinite scrolling. 3) At the top should be a button to create a new group. Clicking takes it to the new group page, with the group form. 4) The group list items should contain: the group name, recurrence, number of active members / number of invited members / number of past meetings / date of next upcoming meeting / an edit/ the ... (ellipsis) dropdown for actions. 5) dropdown buttons allow user to activate the group or deactivate the group. Edit button takes the user to the group form to update it. If there's an upcoming event, there's a button to view the upcoming meeting. If there isn't, there's a button to create a manual meeting."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse My Groups (Priority: P1)

As an authenticated user, I want to open the My Groups tab and see groups I belong to so I can quickly understand and manage my current group activity.

**Why this priority**: This is the core value of the feature; without it, the tab does not provide usable functionality.

**Independent Test**: Sign in as a user with group memberships, open the authenticated home page, select My Groups, and verify only that user's groups are shown with required summary fields.

**Acceptance Scenarios**:

1. **Given** an authenticated user has one or more group memberships, **When** the user opens the My Groups tab, **Then** the tab displays a list of groups the user belongs to.
2. **Given** the My Groups tab is visible, **When** each group item is rendered, **Then** the item shows group name, recurrence, active member count, invited member count, past meetings count, next upcoming meeting date (when present), an Edit action, and an actions dropdown.
3. **Given** an authenticated user has no group memberships, **When** the user opens My Groups, **Then** the tab displays an empty state with clear guidance to create a new group.

---

### User Story 2 - Load More Groups Seamlessly (Priority: P2)

As an authenticated user with many groups, I want additional groups to load as I scroll so I can continue browsing without manual page switching.

**Why this priority**: Prevents list truncation and preserves usability at higher group counts.

**Independent Test**: Seed enough groups to require multiple pages, open My Groups, scroll to the bottom repeatedly, and verify additional pages append until all groups are loaded.

**Acceptance Scenarios**:

1. **Given** the user has more groups than fit in the initial list response, **When** the user scrolls near the end of the loaded list, **Then** the next page of groups is requested and appended.
2. **Given** all available groups are loaded, **When** the user continues scrolling, **Then** no duplicate requests are made and the UI indicates there are no additional groups.
3. **Given** loading another page fails, **When** the failure occurs, **Then** the user sees a recoverable error state and can retry loading more groups.

---

### User Story 3 - Create and Manage Group Actions (Priority: P3)

As an authenticated user, I want quick actions to create groups, edit groups, change activation state, and manage meetings so I can keep group operations up to date from one place.

**Why this priority**: Actionability is required for the tab to be operational, not just informational.

**Independent Test**: From My Groups, select Create New Group, Edit, activation/deactivation, and meeting action paths, and verify each action leads to the expected destination or state change.

**Acceptance Scenarios**:

1. **Given** the user is on My Groups, **When** the user selects the Create New Group button, **Then** the user is taken to the new group page containing the group form.
2. **Given** a group item is visible, **When** the user selects Edit, **Then** the user is taken to the group form preloaded for that group.
3. **Given** a group is currently active, **When** the user opens the actions dropdown, **Then** a Deactivate Group action is available and can set the group to inactive.
4. **Given** a group is currently inactive, **When** the user opens the actions dropdown, **Then** an Activate Group action is available and can set the group to active.
5. **Given** a group has an upcoming meeting, **When** the user opens the actions dropdown, **Then** a View Upcoming Meeting action is available.
6. **Given** a group has no upcoming meeting, **When** the user opens the actions dropdown, **Then** a Create Manual Meeting action is available.

---

### User Story 4 - Create/Edit Group Details and Meeting Routing (Priority: P4)

As an authenticated group creator or admin, I want a complete create/edit group form and consistent routing so I can configure group defaults and immediately manage upcoming meetings.

**Why this priority**: The My Groups actions depend on complete group configuration and predictable destination routes.

**Independent Test**: Open create and edit group routes, verify the form fields and participant selectors, save defaults, create an upcoming meeting from group defaults, and confirm redirect to the meeting edit route.

**Acceptance Scenarios**:

1. **Given** the user opens the create group route, **When** the form loads, **Then** the user can set name, description (basic rich text mode), address, start time, duration, recurrence, public message, attendance message, other admins, and group members.
2. **Given** the user opens the edit route for an existing group, **When** the form loads, **Then** the existing group values are pre-filled for editing.
3. **Given** the user uses admin/member participant selectors, **When** searching and selecting users, **Then** options show avatars and names and selected users are rendered as list items beneath the selector.
4. **Given** the user triggers creation of an upcoming meeting from a group, **When** the meeting is created using the group's defaults, **Then** the user is redirected to the group meeting edit page.
5. **Given** the user navigates to group management routes, **When** creating or editing resources, **Then** URLs follow `/groups/create`, `/groups/:groupId/edit`, and `/groups/:groupId/meetings/:meetingId/edit`.

### Edge Cases

- The user belongs to a very large number of groups; list loading remains stable and does not duplicate or skip entries.
- Group membership changes while the user is viewing My Groups; refresh/reload behavior should prevent stale action targets.
- A group has no upcoming meeting date; meeting summary and action options remain clear and unambiguous.
- A group is deactivated by another actor before the user triggers an action; activation-related actions handle conflict states gracefully.
- Counts for members or meetings are temporarily unavailable; the item still renders with clear fallback indicators.
- Selected admins or members become unavailable between selection and save; validation/error messaging remains actionable.
- A user directly visits an edit URL with an invalid or unauthorized `groupId` or `meetingId`; the system shows a safe not-found/forbidden outcome.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a My Groups tab in the authenticated home page that lists only groups where the current user is a member.
- **FR-002**: System MUST display each group item with the following fields: group name, recurrence, number of active members, number of invited members, number of past meetings, and date of next upcoming meeting when available.
- **FR-003**: System MUST provide list pagination via infinite scrolling, loading additional groups as the user reaches the end of currently loaded results.
- **FR-004**: System MUST prevent duplicate entries when loading additional pages and must stop requesting additional pages once all results are loaded.
- **FR-005**: System MUST provide a Create New Group button at the top of the My Groups tab.
- **FR-006**: Users MUST be taken to the new group page with the group form when selecting Create New Group.
- **FR-007**: System MUST provide an Edit action for each group item.
- **FR-008**: Users MUST be taken to the group form for updating the selected group when selecting Edit.
- **FR-009**: System MUST provide an actions dropdown for each group item.
- **FR-010**: System MUST show exactly one activation-state action in the dropdown based on current group state: Activate Group for inactive groups, Deactivate Group for active groups.
- **FR-011**: System MUST allow users to change a group's active/inactive status through the dropdown and reflect the updated state in the list.
- **FR-012**: System MUST show View Upcoming Meeting in the dropdown when the group has an upcoming meeting.
- **FR-013**: System MUST show Create Manual Meeting in the dropdown when the group has no upcoming meeting.
- **FR-014**: System MUST provide clear loading, empty, and recoverable error states for initial load and subsequent infinite-scroll loads.
- **FR-015**: System MUST preserve the user's scroll context and already loaded results while appending additional pages.
- **FR-016**: System MUST provide a create/edit group form that supports all of the following fields: name, description (basic rich text mode), address, start time, duration, recurrence, public message, and attendance message.
- **FR-017**: System MUST support editing existing groups by accepting an existing-group input/prop model and pre-populating create/edit form values.
- **FR-018**: System MUST provide searchable multi-select controls for adding other admins and group members in the create/edit form.
- **FR-019**: System MUST render user search/select options with avatar and name for admin/member selectors.
- **FR-020**: System MUST render selected admins and selected members as list items with avatar and name beneath each corresponding selector.
- **FR-021**: System MUST create an upcoming meeting using the selected group's default scheduling/configuration values when the user chooses to create that meeting.
- **FR-022**: System MUST redirect users to the meeting edit page after creating an upcoming meeting from group defaults.
- **FR-023**: System MUST use `/groups/create` as the canonical create-group URL and `/groups/:groupId/edit` as the canonical edit-group URL.
- **FR-024**: System MUST use `/groups/:groupId/meetings/:meetingId/edit` as the canonical edit-group-meeting URL.

### Key Entities _(include if feature involves data)_

- **My Group List Item**: Represents one group in the My Groups tab, including summary display attributes, membership/meeting counts, recurrence, upcoming meeting indicator, and available actions.
- **Group Action State**: Represents action eligibility for a group at render time, including activation status and whether an upcoming meeting exists.
- **Paginated Group Segment**: Represents one loaded page of group results, including continuation metadata needed to determine whether more groups are available.
- **Group Form Draft**: Represents the mutable create/edit form state, including textual configuration fields, schedule defaults, and selected admin/member collections.
- **Selectable Participant Summary**: Represents a searchable user option for participant selectors with id, display name, avatar, and role eligibility.
- **Upcoming Meeting Draft**: Represents a meeting initialized from group defaults before redirecting to the meeting edit flow.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 95% of authenticated users can open My Groups and identify at least one of their groups (or the empty state) within 5 seconds.
- **SC-002**: In validation runs with at least 100 total groups for a user, 100% of available groups are reachable through continuous scrolling with no duplicates.
- **SC-003**: 95% of Create New Group and Edit action attempts navigate users to the intended group form destination on first attempt.
- **SC-004**: 95% of valid activation/deactivation and meeting action selections complete with the expected resulting state or destination on first attempt.
- **SC-005**: 90% of users in task-based testing can correctly choose the meeting action (view upcoming vs create manual) without assistance.
- **SC-006**: 95% of create/edit group sessions can complete required form fields and save without field-level confusion or navigation dead ends.
- **SC-007**: 95% of create-upcoming-meeting actions from My Groups redirect to `/groups/:groupId/meetings/:meetingId/edit` within 2 seconds under normal conditions.

## Assumptions

- The authenticated home page already contains a tabbed structure where a My Groups tab can be added or extended.
- Users accessing My Groups are already authorized to view groups they belong to and perform actions they are currently allowed to perform.
- Group recurrence, member counts, meeting counts, and upcoming meeting data are available from existing domain data sources.
- Create New Group and Edit destinations already exist as group form experiences and are in scope only for navigation integration in this feature.
- Meeting creation and meeting detail flows already exist; this feature only determines and routes to the correct action entry point from My Groups.
- Basic rich text editor mode is available for group description without requiring advanced formatting features in this iteration.
- Search endpoints/data sources required for admin/member multi-select are available to authorized users.
