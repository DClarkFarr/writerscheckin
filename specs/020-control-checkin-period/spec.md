# Feature Specification: Control Check-In Period

**Feature Branch**: `020-user-profile-settings`  
**Created**: May 14, 2026  
**Status**: Draft  
**Input**: User description: "as an admin, i should be able to control when the meeting checkin period ends."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configure Group Check-In Cutoff (Priority: P1)

As a group admin, I can set how many hours before meeting start time the check-in period ends, so the group has a clear attendance cutoff rule.

**Why this priority**: This is the source setting that defines all downstream check-in behavior. Without it, the feature has no controllable business value.

**Independent Test**: Can be fully tested by editing a group, saving a new cutoff value, reopening the group, and confirming the saved value remains accurate.

**Acceptance Scenarios**:

1. **Given** a group admin is editing group settings, **When** they view attendance-related settings, **Then** they can see and edit a numeric field labeled "Check-in closes (hours before start)".
2. **Given** a group admin enters a valid number and saves, **When** the save completes, **Then** the group stores that value as its check-in cutoff setting.
3. **Given** a group admin enters an invalid value (blank, negative, or non-numeric), **When** they attempt to save, **Then** the system prevents saving and shows a clear validation message.

---

### User Story 2 - Inherit Cutoff Into Meetings (Priority: P1)

As a group admin, I need each newly created meeting for the group to inherit the group check-in cutoff value, so attendance rules are consistent without extra manual configuration.

**Why this priority**: Inheritance enforces consistency and prevents operational mistakes caused by manually setting each meeting.

**Independent Test**: Can be fully tested by setting a group cutoff value, creating a new meeting from that group, and confirming the meeting uses the same cutoff value.

**Acceptance Scenarios**:

1. **Given** a group has a defined check-in cutoff setting, **When** a meeting is created from that group, **Then** the meeting receives the same cutoff value.
2. **Given** the group cutoff is later changed, **When** a new meeting is created afterward, **Then** that new meeting inherits the updated value.
3. **Given** meetings already existed before the group cutoff change, **When** the setting is updated, **Then** previously created meetings keep their original inherited value unless explicitly edited.

---

### User Story 3 - Enforce and Explain Check-In Window (Priority: P1)

As a participant, I can always see when check-in closes and I am prevented from checking in after the cutoff, even before the meeting starts.

**Why this priority**: Users need a predictable and transparent check-in policy to avoid confusion and reduce support disputes.

**Independent Test**: Can be fully tested by viewing any check-in button area before and after cutoff, verifying the status and accompanying time-limit message in both states.

**Acceptance Scenarios**:

1. **Given** current time is before the meeting start but after the check-in cutoff, **When** a participant views a check-in button, **Then** the button is disabled and a tooltip explains that check-in has ended.
2. **Given** any screen that includes a check-in button, **When** it renders, **Then** it displays a check-in time-limit message near the action.
3. **Given** the check-in cutoff occurs later on the same calendar day, **When** the time-limit message is shown, **Then** it uses a live relative format: "Check-in period ends in [hours] [minutes] [seconds]".
4. **Given** the check-in cutoff occurs on a different calendar day, **When** the time-limit message is shown, **Then** it uses an absolute format: "Check-in period ends [date] at [time]".

### Edge Cases

- What happens when the cutoff value is 0 hours before start: check-in remains available until the meeting start time, then closes at start.
- What happens when the cutoff value is greater than the time between "now" and meeting start: check-in is immediately unavailable for that meeting instance.
- How does the system handle daylight-saving transitions or timezone differences: the cutoff is computed using the meeting's timezone so displayed status and message remain consistent.
- How does the system handle countdown rollover from same-day to next-day formatting: once the cutoff crosses to a different calendar day context, messaging switches to the absolute date/time format.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow group admins to edit a numeric group setting labeled "Check-in closes (hours before start)" within group edit flow.
- **FR-002**: The system MUST validate this setting as a non-negative numeric value and block invalid submissions with clear error feedback.
- **FR-003**: The system MUST persist the group check-in cutoff value so future reads of the same group return the saved value.
- **FR-004**: The system MUST apply the group's saved check-in cutoff value to every newly created meeting that originates from that group.
- **FR-005**: The system MUST preserve each meeting's inherited cutoff value at creation time, even if the group-level value changes later.
- **FR-006**: The system MUST evaluate check-in availability using meeting start time and meeting cutoff value, and treat check-in as closed once cutoff time is reached.
- **FR-007**: The system MUST disable any check-in button when the cutoff has passed, including when the meeting has not started yet.
- **FR-008**: The system MUST provide an explanatory tooltip or equivalent inline explanation whenever check-in is disabled due to cutoff expiration.
- **FR-009**: The system MUST display a check-in time-limit message anywhere a check-in button appears.
- **FR-010**: The system MUST display the time-limit message in relative countdown format when cutoff occurs on the same day.
- **FR-011**: The system MUST display the time-limit message in absolute date/time format when cutoff occurs on a different day.
- **FR-012**: The system MUST keep countdown messaging updated over time so the displayed remaining duration stays accurate while the view is open.

### Key Entities _(include if feature involves data)_

- **Group Check-In Policy**: Group-level attendance configuration containing the number of hours before start when check-in closes.
- **Meeting Check-In Window**: Meeting-level record of check-in availability boundaries derived from meeting start time and inherited cutoff value.
- **Check-In Action Context**: User-facing state for each check-in control, including availability, reason text when disabled, and time-limit message format.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of newly created meetings from configured groups carry the same check-in cutoff value as the source group at creation time.
- **SC-002**: In usability testing, at least 90% of participants correctly identify when check-in closes by reading the displayed message without external help.
- **SC-003**: In test scenarios where current time is after cutoff and before meeting start, 100% of check-in attempts are blocked through disabled controls.
- **SC-004**: For screens with check-in actions, the time-limit message is present in 100% of audited views and uses the correct same-day versus different-day format.

## Assumptions

- Existing permission rules already distinguish group admins from non-admin users.
- Meeting start time and timezone are already available wherever check-in availability is evaluated.
- Existing meeting creation workflows already know which group a meeting originates from.
- Existing check-in action surfaces support displaying supplemental help text and disabled-state explanations.
