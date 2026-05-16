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

---

### User Story 4 - Downgrade Check-in Status After Period Closes (Priority: P2)

As a meeting attendee, after the check-in period has ended, I can downgrade my check-in status to a lower level but cannot upgrade it.

**Why this priority**: Allows attendees to correct an optimistic check-in status without being locked into their choice, improving the user experience when circumstances change.

**Independent Test**: Set a meeting with a closed check-in period. Verify an attendee with 'reading' status can change to 'attending' or 'skipping', an attendee with 'attending' status can change to 'skipping', and no attendee can upgrade their status.

**Acceptance Scenarios**:

1. **Given** check-in period has closed and attendee status is 'reading', **When** attendee views status options, **Then** they can downgrade to 'attending' or 'skipping'.
2. **Given** check-in period has closed and attendee status is 'attending', **When** attendee views status options, **Then** they can downgrade to 'skipping' but not upgrade to 'reading'.
3. **Given** check-in period has closed and attendee status is 'skipping', **When** attendee views status options, **Then** no upgrades are available.
4. **Given** check-in period is still open, **When** attendee attempts a status change, **Then** the change is blocked and user sees appropriate messaging.

---

### User Story 5 - Admin Manual Status Upgrade (Priority: P2)

As a group admin, I can manually upgrade any attendee's check-in status at any time, overriding their self-selected status.

**Why this priority**: Group admins need control over accurate attendance records, especially for attendees who cannot update their own status or when circumstances require correction.

**Independent Test**: As an admin, select an attendee and verify you can upgrade their status from 'skipping' → 'attending' → 'reading' regardless of check-in window state.

**Acceptance Scenarios**:

1. **Given** I am a group admin viewing a meeting, **When** I access attendee management, **Then** I can select an attendee and upgrade their status.
2. **Given** an attendee has status 'skipping', **When** I upgrade to 'attending', **Then** the change persists and is reflected immediately.
3. **Given** an attendee has status 'attending', **When** I upgrade to 'reading', **Then** the change persists and is reflected immediately.
4. **Given** check-in period is still open or has closed, **When** I upgrade an attendee's status, **Then** my admin upgrade action succeeds regardless of window state.
5. **Given** I am not a group admin, **When** I attempt to upgrade another attendee's status, **Then** the action is denied with appropriate permission error.

### Edge Cases

- Current time equals check-in start time exactly; check-in becomes available immediately at that boundary.
- Check-in start occurs on a different calendar day than meeting date because of an extended lead time (for example 48 hours); eligibility still follows check-in start and end timestamps.
- Client clock continues updating while the feed item stays mounted for long periods; countdown remains accurate and does not freeze.
- User crosses midnight or local timezone boundaries while viewing the meeting item; availability is still based on the defined check-in window rather than same-day meeting matching.
- Attendee attempts downgrade immediately when check-in period closes (at exact close boundary); downgrade is allowed.
- Attendee's status has already been upgraded by admin; when attendee later attempts to downgrade, the admin upgrade is overridden by attendee downgrade action.
- Multiple admins upgrade same attendee simultaneously; last write wins and system remains consistent.
- Attendee whose status was downgraded by themselves later has it upgraded by admin; subsequent attendee downgrade is allowed since check-in period remains closed.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow meeting attendees to check in whenever current time is on or after the meeting check-in start timestamp and before the check-in end timestamp.
- **FR-002**: System MUST NOT require current calendar date to match the meeting date in order to allow check-in.
- **FR-003**: System MUST remove or replace any tooltip or guidance text that claims check-in is limited to the day of the meeting.
- **FR-004**: System MUST display check-in period remaining-time text that updates every second while the check-in window is active.
- **FR-005**: System MUST keep the pre-window button label as check-in starts soon and MUST NOT embed countdown values in that button text.
- **FR-006**: System MUST show countdown details, when applicable, in supporting text beneath the action button.
- **FR-007**: System MUST update UI state immediately when check-in transitions between not-open, open, and closed states during an active viewing session.
- **FR-008**: After check-in period closes, attendees MUST be able to downgrade their status ('reading' → 'attending'/'skipping', 'attending' → 'skipping') but MUST NOT be able to upgrade.
- **FR-009**: System MUST prevent status changes while check-in period is open; all status modifications for attendees MUST be blocked until check-in has closed.
- **FR-010**: Group admins MUST be able to upgrade any attendee's check-in status to any higher level regardless of check-in window state or current attendee status.
- **FR-011**: Group admins MUST NOT be able to downgrade attendee status; admin action is restricted to upgrades only.
- **FR-012**: System MUST enforce group admin role authorization before allowing admin status upgrade operations; non-admins MUST receive permission denied error.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In validation scenarios where check-in opens before meeting day, 100% of eligible attendees can check in after check-in start and before check-in end.
- **SC-002**: During active check-in windows, displayed remaining-time text updates every second for at least 60 consecutive seconds without skipped intervals.
- **SC-003**: In pre-window state verification, 100% of observed meeting feed items retain the static button label check-in starts soon with no countdown content in the button.
- **SC-004**: User-reported confusion about day-of-meeting-only check-in behavior is reduced by at least 80% within one release cycle after rollout.
- **SC-005**: Attendee downgrade functionality works for 100% of valid downgrade paths ('reading' → 'attending'/'skipping', 'attending' → 'skipping') after check-in closes.
- **SC-006**: Status downgrade operations are rejected 100% of the time when attempted while check-in period is open.
- **SC-007**: Admin status upgrade operations succeed 100% of the time for authorized group admins and are rejected for non-admins.
- **SC-008**: Attendee-initiated downgrade and admin-initiated upgrade operations can coexist; last action taken determines final status.

## Assumptions

- Existing meeting records already define authoritative check-in start and check-in end timestamps.
- This feature applies to meeting feed presentation, check-in eligibility behavior, and post-period status management.
- Countdown display and state transitions rely on client-side time progression during an open session.
- Existing check-in authorization and audit behavior outside these timing/display rules remains unchanged.
- Group admin authorization is determined by existing group membership role (group admins can already perform management actions).
- Status hierarchy is: 'reading' > 'attending' > 'skipping' (from high to low commitment level).
- Attendee self-initiated downgrades require check-in period to be closed; admin upgrades are unrestricted by window state.
- Once check-in period closes, it does not reopen for that meeting; status modifications made after close persist until changed again.
