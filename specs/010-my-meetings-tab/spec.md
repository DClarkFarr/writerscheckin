# Feature Specification: My Meetings Tab

**Feature Branch**: `010-create-feature-branch`  
**Created**: 2026-05-03  
**Status**: Draft  
**Input**: User description: "as a user, I should be able to see my meetings in the my meetings tab on the home page.

The meetings list should display the next upcoming meeting for each group, sorted by date and then by name. Next it should display past events, also by occurrence date and then name.

As a user, I should be able to see my check-in status for upcoming events. I should be able to mark myself as attending or attending+reading. I should also be able to mark myself as absent.

The design for the menu items is mocked in my-meetings.png. Each list item should have a colorful border and colorful left bookend that match. Blue for upcoming, red for skipping/absent and gray for past. The colored left bookend should contain the date, with D large on the top line, then MMM 1st on the second line and the 4 digit year on the bottom line.

Then we should have the name of the event, the number of people attending and the number of people reading.

Badges at the bottom should indicate 'you are coming' 'you are reading' or 'you are not coming'. And on the left, should be a button to check in, update check-in. The button color should match the border and left bookend color.

This event list should be infinite scrolling."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Upcoming And Past Meetings (Priority: P1)

As an authenticated user, I can open the My Meetings tab on the home page and immediately see a chronologically ordered feed that starts with upcoming meetings and then continues with past meetings.

**Why this priority**: This is the core value of the feature because users need fast visibility into what is next and what already happened without navigating into each group.

**Independent Test**: Can be fully tested by loading the My Meetings tab with seeded upcoming and past meetings, then confirming section order and sorting without interacting with check-in controls.

**Acceptance Scenarios**:

1. **Given** I belong to multiple groups with upcoming meetings, **When** I open My Meetings, **Then** I see at most one next upcoming meeting per group in the upcoming portion of the list.
2. **Given** multiple upcoming meetings are shown, **When** meetings share the same date, **Then** they are secondarily sorted by meeting name alphabetically.
3. **Given** past meetings exist, **When** I continue down the list after upcoming meetings, **Then** I see past meetings sorted by occurrence date and then by name.

---

### User Story 2 - Update Personal Check-In Status (Priority: P2)

As a user, I can view and update my personal check-in status on upcoming meetings to reflect whether I am coming, coming and reading, or not coming.

**Why this priority**: Check-in status directly drives attendance planning and reading assignments for upcoming events.

**Independent Test**: Can be fully tested by opening an upcoming meeting item, setting each check-in option, and verifying the badge and button label update correctly after each change.

**Acceptance Scenarios**:

1. **Given** an upcoming meeting card, **When** I view the card, **Then** my current check-in status is visible as a badge.
2. **Given** an upcoming meeting card, **When** I choose attending, attending+reading, or absent, **Then** the selected state is persisted and reflected in the card badges.
3. **Given** I already submitted a status, **When** I return to My Meetings later, **Then** the card still shows my last saved status.

---

### User Story 3 - Understand Meeting State At A Glance (Priority: P3)

As a user, I can quickly interpret each meeting item through consistent visual cues including color, date block, attendance counts, and state-aware action controls.

**Why this priority**: Clear visual encoding reduces cognitive load and helps users decide what action to take next.

**Independent Test**: Can be fully tested by rendering upcoming, absent/skipping, and past items and validating border color, left bookend color, date format, counts, badges, and button styling against the stated rules.

**Acceptance Scenarios**:

1. **Given** an upcoming meeting where I am not marked absent, **When** the card is rendered, **Then** border, left bookend, and check-in button use blue styling.
2. **Given** an upcoming meeting where I marked absent, **When** the card is rendered, **Then** border, left bookend, and check-in button use red styling.
3. **Given** a past meeting card, **When** the card is rendered, **Then** border and left bookend use gray styling and the date block shows day, month+ordinal day, and 4-digit year on separate lines.

---

### User Story 4 - Browse Long Meeting Histories (Priority: P4)

As a user with many meetings, I can continue scrolling to load more meeting items without switching pages.

**Why this priority**: Infinite scrolling keeps the experience continuous and avoids context loss in long histories.

**Independent Test**: Can be fully tested by loading enough meetings to require multiple fetches and verifying additional items append in order while preserving already loaded items.

**Acceptance Scenarios**:

1. **Given** more meetings exist than the first loaded set, **When** I scroll near the bottom, **Then** the next set of meetings loads and appends to the existing list.
2. **Given** no more meetings remain, **When** I reach the end of the list, **Then** loading stops and no duplicate items appear.

---

### Edge Cases

- A user belongs to a group with no upcoming meeting; that group contributes no upcoming item, but the user still sees eligible past meetings.
- Two meetings share identical occurrence date and name; list order remains deterministic and stable between loads.
- A check-in update fails due to a transient issue; the previously displayed status remains visible and the user can retry.
- A meeting crosses date boundaries in different time zones; the displayed date lines remain consistent with the user-facing calendar context.
- A user has no meetings at all; the tab shows an explicit empty state instead of an endless loading state.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a My Meetings tab on the home page for authenticated users.
- **FR-002**: The system MUST display upcoming meetings before past meetings in the My Meetings feed.
- **FR-003**: For upcoming meetings, the system MUST include only the next upcoming meeting per group.
- **FR-004**: Upcoming meetings MUST be sorted by occurrence date and then by meeting name.
- **FR-005**: Past meetings MUST be sorted by occurrence date and then by meeting name.
- **FR-006**: Each meeting item MUST display meeting name, attendee count, and reader count.
- **FR-007**: Each meeting item MUST include a left date bookend with three lines: large day number on line 1, month plus ordinal day on line 2, and 4-digit year on line 3.
- **FR-008**: Each meeting item MUST display matching color treatment across border and left bookend based on state: blue for upcoming, red for upcoming meetings marked absent/skipping by the user, and gray for past meetings.
- **FR-009**: Each upcoming meeting item MUST show the user's current check-in status.
- **FR-010**: The system MUST let users set check-in status for upcoming meetings to one of: attending, attending+reading, or absent.
- **FR-011**: The system MUST persist check-in status changes so they are visible on subsequent visits.
- **FR-012**: The system MUST show status badges using the labels: "you are coming", "you are reading", and "you are not coming" when applicable.
- **FR-013**: Each upcoming meeting item MUST provide a check-in action button whose label reflects whether the user is creating an initial check-in or updating an existing one.
- **FR-014**: The check-in action button color MUST match the same state color used by the item border and left bookend.
- **FR-015**: The meetings feed MUST support infinite scrolling that appends additional items while preserving already loaded items.
- **FR-016**: The system MUST prevent duplicate meeting items from appearing when additional items are loaded.
- **FR-017**: The system MUST provide clear empty and recoverable error states for meeting list loading and check-in updates.

### Key Entities

- **My Meeting Item**: A user-visible meeting row in the feed containing meeting identity, occurrence date, visual state, attendance totals, and user check-in state.
- **User Check-In State**: The user's relationship to an upcoming meeting with allowed values of attending, attending+reading, or absent.
- **Meeting Feed Segment**: A logical grouping of items by temporal category (upcoming first, then past) while maintaining list-wide sort and pagination behavior.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of seeded upcoming meetings shown in My Meetings are the nearest upcoming meeting per group and appear before any past meeting item.
- **SC-002**: In sorting validation runs, 100% of visible items follow the defined primary sort by occurrence date and secondary sort by name for both upcoming and past segments.
- **SC-003**: At least 95% of users in usability testing can correctly identify their check-in state from badges within 5 seconds of viewing a meeting card.
- **SC-004**: At least 95% of users can successfully change their check-in state on an upcoming meeting on the first attempt.
- **SC-005**: During long-list validation, the feed loads at least three additional pages via scrolling with zero duplicate items and without clearing previously visible items.

## Assumptions

- Users accessing My Meetings are already authenticated and have existing group memberships.
- Occurrence date comparisons and display use the same user-facing time basis used elsewhere in the application.
- Past meetings are read-only for check-in updates in this feature.
- Infinite scrolling uses the existing product behavior for loading indicators and end-of-list messaging.
