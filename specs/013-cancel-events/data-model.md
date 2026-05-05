# Data Model: Cancel Published Meetings

## Entity: GroupMeeting

- Purpose: Canonical persisted meeting document in MongoDB for group events.
- Existing key fields in scope:
  - `groupId`
  - `name`
  - `occursAt`
  - `status`
  - `publishHoursBefore`
  - `publishEmailMessage`
  - `attendanceEmailMessage`
- New field:
  - `cancelledAt: string | null`
- Validation rules:
  - `cancelledAt` defaults to `null` on meeting creation.
  - When `status` transitions to `cancelled`, `cancelledAt` must be set to a valid ISO timestamp string.
  - When `status` is `draft` or `published`, `cancelledAt` must be `null`.

## Entity: MeetingPublicationStatus

- Purpose: Lifecycle status used for query visibility and action eligibility.
- Values:
  - `draft`
  - `published`
  - `cancelled`
- Rules:
  - `draft -> published` allowed by existing publish flow.
  - `published -> cancelled` allowed by new cancel flow for authorized admins.
  - `cancelled` is terminal for this feature scope (no edit, no publish, no check-in transitions).

## Entity: MeetingCancellationActionContext

- Purpose: Derived server/client context determining whether cancellation controls appear and whether cancellation can execute.
- Inputs:
  - Meeting status
  - Meeting time state (upcoming/past)
  - Current user role/permissions
- Derived capability fields:
  - `canCancel`: true only for authorized admins on eligible published meetings.
  - `canEdit`: false when meeting is canceled.
  - `canCheckin`: false when meeting is canceled.

## Entity: MeetingCancellationConfirmation

- Purpose: UI interaction state for the irreversible cancel action.
- Fields:
  - `meetingId`
  - `isOpen`
  - `isSubmitting`
  - `warningCopy` (must include RSVP notification impact)
- Rules:
  - Confirmation must be accepted before mutation execution.
  - Dismiss/close leaves meeting unchanged.
  - While submitting, duplicate submits are prevented.

## Entity: CancelledMeetingDisplayTone

- Purpose: Frontend visual semantic for canceled meetings.
- Visual contract:
  - Primary canceled accent: dark orange.
  - Supporting canceled neutral: gray.
- Applied to:
  - Feed item border/bookend tone mapping.
  - Status badges and disabled action treatments for canceled rows.
- Accessibility rule:
  - Text and icon color pairings on orange/gray surfaces must meet constitution contrast requirements.

## State Transitions

- Creation transition:
  - New meeting is created with `status = draft`, `cancelledAt = null`.
- Publish transition:
  - Draft meeting publishes to `status = published`, `cancelledAt = null`.
- Cancel transition:
  - Published meeting confirms cancellation and transitions to `status = cancelled` with `cancelledAt = nowISO`.
- Post-cancel behavior transition:
  - Queries still return the meeting.
  - Edit actions become unavailable.
  - Check-in actions become unavailable.
  - UI tone shifts to canceled theme (dark orange/gray).
