# Feature Specification: Meeting View And Edit

**Feature Branch**: `011-meeting-view-edit`  
**Created**: 2026-05-03  
**Status**: Draft  
**Input**: User description: "Add meeting view and edit functionality.

## 1. MeetingFeedItem

To the right of the optional 'admin only' badge, there should be an action button, group items.
1.1 As a member, I should be able to click 'view meeting', and be taken to the view meeting summary page.
1.2 As an admin or owner, i should also have an edit button that takes me to the edit meeting page.

## 2. GroupMeetingsSection

From the edit group page > meetings section, admin users should have the option to view and edit meetings. These buttons appear as a button group in the top right corner.

## 3. As a member or admin, I should be able to view a meeting details page, which contains the address and description, as well as list of all members and their attending status.

3.1. As an admin, I should see an edit meeting button at the top for easy access.

3.2. As any user, i should see my own attending status at the top, and have a select dropdown for quick check-in.

## 4. as an admin, i should be able to update the relevant fields for any meeting. The form should auto-save on debounce and toast alert success. At the top should be bit bright button to publish when in draft state. Some helper text below the button should explain when the meeting will be published automatically, based on the meetings settings. Publishing now will alert members immediately and allow the checkin process to start."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Meeting Details From Existing Meeting Lists (Priority: P1)

As a member, admin, or owner, I can open a dedicated meeting details page from meeting entries that already appear in the home feed or the group management area.

**Why this priority**: A dedicated meeting view is the core gap in the current experience because users need a single place to see full meeting information instead of relying on summary cards alone.

**Independent Test**: Can be fully tested by opening a meeting from the home feed and from the group meetings section, then confirming the same meeting details page loads with the correct information for the selected meeting.

**Acceptance Scenarios**:

1. **Given** a member can see a meeting in the home feed, **When** they choose the view action, **Then** they are taken to that meeting's details page.
2. **Given** an admin is viewing meetings within a group's meetings section, **When** they choose the view action for a meeting, **Then** they are taken to that meeting's details page.
3. **Given** a user opens the meeting details page, **When** the page loads, **Then** it shows the meeting name, address, description, attendee list, and each listed member's attendance status.

---

### User Story 2 - Update Personal Attendance From The Meeting View (Priority: P2)

As any meeting participant, I can immediately see my own attendance state at the top of the meeting details page and update it without leaving the page.

**Why this priority**: Fast self-service attendance updates reduce friction and make the details page useful to all members, not only admins.

**Independent Test**: Can be fully tested by opening a meeting details page as a member, changing the personal attendance selection, and confirming the updated state remains visible on refresh.

**Acceptance Scenarios**:

1. **Given** I open a meeting details page, **When** the page finishes loading, **Then** my current attendance state is shown near the top of the page.
2. **Given** I have permission to respond to a meeting, **When** I choose a different attendance option from the quick check-in control, **Then** my new state is saved and reflected in the page header.
3. **Given** my attendance state changes, **When** the member list is refreshed or revisited, **Then** my listed status matches the latest saved value.

---

### User Story 3 - Reach Meeting Editing Quickly As An Admin (Priority: P3)

As an admin or owner, I can reach meeting editing from every management-oriented meeting surface so I do not have to navigate back through multiple screens.

**Why this priority**: Admin efficiency matters because meeting edits are time-sensitive and often happen while reviewing meetings in context.

**Independent Test**: Can be fully tested by signing in as an admin or owner and confirming edit actions are available from the home meeting card, the group meetings section, and the meeting details page.

**Acceptance Scenarios**:

1. **Given** I am an admin or owner viewing a meeting in the home feed, **When** I inspect the meeting actions, **Then** I see both view and edit actions.
2. **Given** I am an admin viewing the group meetings section on the group edit page, **When** I inspect a meeting row, **Then** I see both view and edit actions grouped together in the meeting controls area.
3. **Given** I am on a meeting details page as an admin or owner, **When** the page loads, **Then** an edit action is visible near the top of the page for quick access.

---

### User Story 4 - Edit And Publish A Meeting With Low Friction (Priority: P4)

As an admin or owner, I can edit meeting details in place, have changes save automatically after I pause, receive clear confirmation that saving succeeded, and publish a draft meeting immediately when needed.

**Why this priority**: Editing and publishing complete the management workflow and reduce the risk of forgotten saves or delayed member communication.

**Independent Test**: Can be fully tested by editing multiple meeting fields, pausing to allow automatic save, observing confirmation feedback, and then publishing a draft meeting from the edit page.

**Acceptance Scenarios**:

1. **Given** I am editing a meeting, **When** I change an editable field and stop typing briefly, **Then** the system saves the change automatically without requiring a manual save action.
2. **Given** an automatic save succeeds, **When** the save completes, **Then** I receive a visible success confirmation.
3. **Given** the meeting is still in draft state, **When** I open the edit page, **Then** I see a prominent publish action and helper text explaining the scheduled automatic publish timing.
4. **Given** the meeting is in draft state, **When** I choose publish now, **Then** the meeting becomes published immediately and members can begin using the attendance workflow right away.

---

### Edge Cases

- A member opens a meeting details page for a meeting they are allowed to view but does not yet have an attendance response; the page still shows a clear default state and allows a first response.
- An admin opens a meeting that has no address or no description yet; the page still loads cleanly and shows that the field is currently empty.
- An automatic save fails after the admin edits a field; the page preserves the unsaved change state clearly enough for the admin to retry without losing context.
- A draft meeting is published manually shortly before its scheduled automatic publish time; the system publishes it only once and does not send duplicate member-facing availability changes.
- A non-admin user reaches the meeting details page; they can view meeting information and update only their own attendance, but they do not see edit or publish controls.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a dedicated meeting details page for every meeting a user is allowed to access.
- **FR-002**: The system MUST let users open the meeting details page from meeting entries shown in the home meetings feed.
- **FR-003**: The system MUST let admins open the meeting details page from the meetings section within the group management experience.
- **FR-004**: The meeting details page MUST display the meeting name, address, description, and a list of members with each member's attendance status.
- **FR-005**: The meeting details page MUST display the signed-in user's current attendance status near the top of the page.
- **FR-006**: The system MUST let an eligible user update their own attendance status directly from the meeting details page.
- **FR-007**: Attendance status changes made from the meeting details page MUST be persisted and reflected when the user revisits the page.
- **FR-008**: Every meeting entry in the home meetings feed MUST include a view action.
- **FR-009**: Every meeting entry in the home meetings feed visible to an admin or owner MUST also include an edit action.
- **FR-010**: Every meeting row in the group meetings section visible to an admin MUST include grouped view and edit actions.
- **FR-011**: The meeting details page MUST display an edit action near the top when viewed by an admin or owner.
- **FR-012**: The system MUST provide an edit meeting page for admins and owners to update the meeting's editable fields.
- **FR-013**: Changes on the edit meeting page MUST save automatically after a short pause in editing.
- **FR-014**: The system MUST show a visible success confirmation after an automatic save completes successfully.
- **FR-015**: When a meeting is in draft state, the edit meeting page MUST show a prominent publish action.
- **FR-016**: When a meeting is in draft state, the edit meeting page MUST explain when the meeting would otherwise publish automatically based on the meeting's configured timing.
- **FR-017**: Choosing the immediate publish action MUST publish the meeting right away and make the attendance workflow available to members immediately.
- **FR-018**: Users without admin or owner privileges MUST NOT be shown meeting edit or publish controls.
- **FR-019**: The system MUST provide clear, recoverable feedback when meeting details fail to load, attendance changes fail, or automatic save fails.

### Key Entities

- **Meeting Detail View**: The full user-facing representation of a single meeting, including descriptive information, attendance summary data, member attendance states, and the signed-in user's own status.
- **Meeting Action Set**: The set of actions available for a meeting in a given context, including view for all eligible users and edit or publish for privileged users.
- **Editable Meeting Fields**: The subset of meeting information that admins and owners can update after creation, such as descriptive content, location, timing-related values, and member-facing messaging.
- **Attendance Status Record**: A participant's current response for a meeting, used both for the user's own quick check-in state and for the member list shown on the meeting details page.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of eligible users can open the correct meeting details page from every supported entry point on the first attempt.
- **SC-002**: In seeded meeting-detail validation, 100% of tested meeting pages show the required address, description, member list, and attendance-state information when that data exists.
- **SC-003**: At least 95% of users can identify and update their own attendance status from the meeting details page in under 15 seconds.
- **SC-004**: At least 95% of admins can complete a meeting field edit and observe confirmation of the saved change on their first attempt.
- **SC-005**: In draft-meeting validation, 100% of manually published meetings become immediately visible as published and available for member attendance responses without requiring a second publish action.

## Assumptions

- Existing authentication and role rules already determine whether a user is a member, admin, or owner for a given group.
- The meeting details page reuses the existing attendance statuses already supported elsewhere in the product rather than introducing new attendance states.
- The current product already has or will provide a standard non-blocking success message pattern that this feature can reuse for automatic save confirmation.
- Members can view only meetings they are already allowed to see through existing group-based access rules.
- The set of editable meeting fields matches the fields that are already part of meeting creation and management, unless restricted elsewhere by existing business rules.
