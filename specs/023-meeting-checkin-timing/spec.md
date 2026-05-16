# Feature Specification: Meeting Check-in Timing

**Feature Branch**: 023-realtime-meeting-updates  
**Created**: May 16, 2026  
**Status**: Draft  
**Input**: User description: "1. As a user, i should be able to check in to a meeting, whose check-in period has opened, even if it's another day. Currently, there is a tooltip saying it can only be the day of the meeting. This functionality should go away. If the checkin period starts 48 hours before, we should only check if current date is after check in date.

2. The Meeting feed item checkin text Check-in period ends in 7 hours 41 minutes 41 seconds should update by the second.

3. the button that says 'check- in starts soon' and should never contain the countdown. Leave that for the text below."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Check In After Window Opens (Priority: P1)

As a meeting attendee, I can check in as soon as the meeting check-in period opens, even when the meeting date is on a later calendar day.

**Why this priority**: This directly governs whether users can complete the core meeting check-in action at the intended time.

**Independent Test**: Configure a meeting with a check-in window that opens before the meeting day, set current time after the check-in start time and before check-in close time, and verify check-in is allowed.

**Acceptance Scenarios**:

1. **Given** a meeting whose check-in start time is in the past and meeting date is in the future, **When** an eligible attendee opens the meeting feed item, **Then** the attendee can initiate check-in.
2. **Given** check-in is allowed because current time is after check-in start time, **When** the attendee views guidance text or tooltips, **Then** no message states check-in is restricted to the meeting day.

---

### User Story 2 - See Accurate Live Countdown (Priority: P2)

As a meeting attendee, I see the check-in time-remaining text update every second so the remaining time is always current.

**Why this priority**: Precise countdown feedback reduces confusion about whether check-in is still available.

**Independent Test**: Open a meeting feed item with an active check-in window and observe the countdown text for at least 5 seconds to confirm second-by-second updates.

**Acceptance Scenarios**:

1. **Given** an active check-in window, **When** the attendee keeps the meeting feed item visible, **Then** the check-in period countdown text decreases once per second.
2. **Given** the countdown reaches zero, **When** the timer elapses, **Then** the UI reflects that check-in has ended without stale remaining-time text.

---

### User Story 3 - Keep Button Label Stable (Priority: P3)

As a meeting attendee, I see a stable button label that says check-in starts soon before the window opens, and countdown details appear only in supporting text below.

**Why this priority**: Clear separation of action labels and supporting timing detail improves scanability and reduces visual noise.

**Independent Test**: Open a meeting feed item before check-in opens and verify the button label remains static while timing details render in dedicated supporting text.

**Acceptance Scenarios**:

1. **Given** the check-in window has not opened, **When** the attendee views the meeting feed item, **Then** the button label displays check-in starts soon.
2. **Given** the check-in window has not opened, **When** countdown information is shown, **Then** countdown values appear in supporting text below the button and never inside the button label.

### Edge Cases

- Current time equals check-in start time exactly; check-in becomes available immediately at that boundary.
- Check-in start occurs on a different calendar day than meeting date because of an extended lead time (for example 48 hours); eligibility still follows check-in start and end timestamps.
- Client clock continues updating while the feed item stays mounted for long periods; countdown remains accurate and does not freeze.
- User crosses midnight or local timezone boundaries while viewing the meeting item; availability is still based on the defined check-in window rather than same-day meeting matching.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow meeting attendees to check in whenever current time is on or after the meeting check-in start timestamp and before the check-in end timestamp.
- **FR-002**: System MUST NOT require current calendar date to match the meeting date in order to allow check-in.
- **FR-003**: System MUST remove or replace any tooltip or guidance text that claims check-in is limited to the day of the meeting.
- **FR-004**: System MUST display check-in period remaining-time text that updates every second while the check-in window is active.
- **FR-005**: System MUST keep the pre-window button label as check-in starts soon and MUST NOT embed countdown values in that button text.
- **FR-006**: System MUST show countdown details, when applicable, in supporting text beneath the action button.
- **FR-007**: System MUST update UI state immediately when check-in transitions between not-open, open, and closed states during an active viewing session.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In validation scenarios where check-in opens before meeting day, 100% of eligible attendees can check in after check-in start and before check-in end.
- **SC-002**: During active check-in windows, displayed remaining-time text updates every second for at least 60 consecutive seconds without skipped intervals.
- **SC-003**: In pre-window state verification, 100% of observed meeting feed items retain the static button label check-in starts soon with no countdown content in the button.
- **SC-004**: User-reported confusion about day-of-meeting-only check-in behavior is reduced by at least 80% within one release cycle after rollout.

## Assumptions

- Existing meeting records already define authoritative check-in start and check-in end timestamps.
- This feature applies to meeting feed presentation and check-in eligibility behavior only; no new user roles or permissions are introduced.
- Countdown display and state transitions rely on client-side time progression during an open session.
- Existing check-in authorization and audit behavior outside these timing/display rules remains unchanged.
