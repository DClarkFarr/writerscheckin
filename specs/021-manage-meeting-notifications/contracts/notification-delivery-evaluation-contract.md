# Contract: Notification Delivery Evaluation

## Scope

Define send/suppress rules for group meeting notification emails based on membership unsubscribe flags.

## Notification Types

- `newMeetingPublication`
- `newMeetingCheckin`
- `meetingAttendance`
- `meetingAttendanceUpdates`

## Source of Truth

Per recipient membership document field:

- `membership.unsubscribedNotifications`

## Evaluation Rule

For event type `T`:

- `isUnsubscribed = Boolean(membership.unsubscribedNotifications?.[T])`
- If `isUnsubscribed === true`, do not send email for `T`.
- If `isUnsubscribed === false`, member remains eligible for existing recipient filters.

## Event Mapping

- Meeting published -> evaluate `newMeetingPublication`
- Meeting becomes check-in eligible -> evaluate `newMeetingCheckin`
- Pre-meeting attendance summary -> evaluate `meetingAttendance`
- Post-checkin RSVP-change updates -> evaluate `meetingAttendanceUpdates`

## Data Defaults

- Missing `unsubscribedNotifications` field behaves as `{}`.
- Missing key for event type behaves as subscribed.

## Non-Goals

- This contract does not alter event trigger timing logic.
- This contract does not introduce per-channel preferences beyond email.

## Compatibility and Safety

- Filtering is additive to existing recipient eligibility checks.
- Existing recipients are unaffected unless they explicitly unsubscribe for that event type.
