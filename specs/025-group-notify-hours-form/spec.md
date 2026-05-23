# Feature Specification: Group Notify Hours Before Form Field

**Feature Branch**: `025-group-notify-hours-form`  
**Created**: 2026-05-23  
**Status**: Draft  
**Input**: User description: "as a user, i should be able to update the 'notifyAttendanceHoursBefore' field in the group form, so that the value is inherited in the by new meetings that are created. Currently in the group form 'star time', 'duration' and 'check-in closes' are in a single row with 3 columns. Let's make it 2 columns and move 'check-in closes' to a new row with the notify hours before input, so we can have two rows with two columns"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Edit Notify Hours Before in Group Form (Priority: P1)

As a group owner or admin, I want to set the "Notify Attendance Hours Before" value in the group settings form, so that newly created meetings automatically inherit the correct attendance notification timing.

**Why this priority**: This is the core feature request — without it the field is not editable in the group form and new meetings always use the existing default.

**Independent Test**: Can be fully tested by opening a group's edit/settings form, updating the "Notify Attendance Hours Before" field, saving, then creating a new meeting from defaults and verifying the meeting inherits the updated value.

**Acceptance Scenarios**:

1. **Given** I am viewing the group settings form, **When** I locate the scheduling section, **Then** I see a "Notify Attendance Hours Before" input field alongside the "Check-In Closes" field.
2. **Given** I update "Notify Attendance Hours Before" to a new value and save the group, **When** I create a new meeting from group defaults, **Then** the meeting's `notifyAttendanceHoursBefore` value matches the one I set on the group.
3. **Given** I open the group form, **When** I view the scheduling layout, **Then** I see two rows each with two columns: Row 1 contains "Start Time" and "Duration"; Row 2 contains "Check-In Closes" and "Notify Attendance Hours Before".

---

### User Story 2 - Existing Groups Retain Notify Hours Value (Priority: P2)

As a group owner, I want existing groups to display their current `notifyAttendanceHoursBefore` value when I open the group form, so that I can review and update it without losing the existing setting.

**Why this priority**: Data integrity — existing groups must not lose their current value when the form is opened and re-saved.

**Independent Test**: Open the edit form for an existing group that already has `notifyAttendanceHoursBefore` set; verify the field is pre-populated with the saved value; save without changing it; confirm the value is unchanged.

**Acceptance Scenarios**:

1. **Given** a group with `notifyAttendanceHoursBefore` already set, **When** I open the group form, **Then** the field is pre-populated with the existing value.
2. **Given** I open the group form and save without changing "Notify Attendance Hours Before", **When** I reload the form, **Then** the previously saved value is still displayed.

---

### Edge Cases

- What happens when a user enters 0 for "Notify Attendance Hours Before"? The system should accept 0 as a valid value (disables the attendance notification).
- What happens when the field is left blank? The form should either prevent saving with a validation error or fall back to the existing system default.
- How does the layout adapt on small screens? The two-column rows should stack to single-column on mobile viewports consistent with the rest of the form.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The group settings form MUST include an editable "Notify Attendance Hours Before" input field.
- **FR-002**: The "Notify Attendance Hours Before" field MUST be pre-populated with the group's current saved value when the form is opened.
- **FR-003**: When a group is saved with an updated "Notify Attendance Hours Before" value, the group record MUST persist the new value.
- **FR-004**: When a new meeting is created from group defaults, it MUST inherit the group's current `notifyAttendanceHoursBefore` value.
- **FR-005**: The group form scheduling section MUST be restructured into two rows of two columns each:
  - Row 1: "Start Time" | "Duration"
  - Row 2: "Check-In Closes" | "Notify Attendance Hours Before"
- **FR-006**: The "Notify Attendance Hours Before" field MUST accept non-negative integer values representing hours.
- **FR-007**: The form MUST validate that "Notify Attendance Hours Before" is a non-negative number before allowing save.

### Key Entities

- **Group**: Represents a writing group; has a `notifyAttendanceHoursBefore` attribute that stores how many hours before a meeting the attendance notification is sent.
- **Meeting**: Created from group defaults; inherits `notifyAttendanceHoursBefore` from the parent group at creation time.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A group owner can locate, update, and save the "Notify Attendance Hours Before" field in under 30 seconds from opening the group form.
- **SC-002**: 100% of new meetings created from group defaults inherit the `notifyAttendanceHoursBefore` value set on the group.
- **SC-003**: The scheduling section of the group form renders in a two-row, two-column layout across all supported screen sizes (stacking gracefully on mobile).
- **SC-004**: No existing group data is lost when the group form is saved after this change is deployed.

## Assumptions

- The group form already persists other scheduling fields (start time, duration, check-in closes hours before) successfully; this feature adds one more field to the same pattern.
- The `notifyAttendanceHoursBefore` field already exists on the Group data model and is already inherited by meetings at creation time; the gap is only that the group form does not currently expose it for editing.
- The form layout change (2 columns instead of 3 for the scheduling row) is a pure UI restructuring with no backend impact.
- Input validation style (e.g., inline error messages) will follow existing patterns used by other numeric fields in the group form.
- Mobile responsive behavior follows existing form conventions in the project.
