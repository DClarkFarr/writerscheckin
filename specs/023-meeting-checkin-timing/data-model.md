# Data Model: Meeting Check-in Timing

## Entity: MeetingCheckinWindowState (derived)

Represents current temporal state of a meeting's check-in window for a specific user session.

### Fields

- `meetingId: string`
- `occursAt: string`
- `checkinOpensAt: string` (derived from meeting policy; may be before meeting day)
- `checkinClosesAt: string`
- `now: string`
- `isOpen: boolean`
- `isClosed: boolean`
- `isUpcomingMeeting: boolean`

### Validation Rules

- `checkinOpensAt <= checkinClosesAt`
- `isOpen` is true only when `now >= checkinOpensAt` and `now < checkinClosesAt`
- `isClosed` is true when `now >= checkinClosesAt`
- Same-day date matching with `occursAt` is not part of eligibility

---

## Entity: CheckinActionPresentationState (derived)

UI contract for button label and supporting message in feed/detail check-in controls.

### Fields

- `buttonLabel: string`
- `buttonDisabled: boolean`
- `supportingMessage: string`
- `showLiveCountdown: boolean`

### Validation Rules

- Before open window: `buttonLabel` is static `Check-in starts soon`
- Countdown values MUST NOT be included in `buttonLabel`
- Countdown values MAY appear only in `supportingMessage`
- During open window: supporting message updates every second

---

## Entity: MeetingCheckinEligibility (existing service result)

Authoritative backend eligibility for check-in mutation requests.

### Fields

- `meetingId: string`
- `groupId: string`
- `membershipStatus: "accepted" | other`
- `occursAt: string`
- `checkinClosesAt: string`
- `canMutate: boolean`
- `rejectReason?: "meeting_not_found" | "forbidden" | "meeting_not_upcoming" | "checkin_closed"`

### Validation Rules

- Membership MUST be accepted
- Meeting MUST still be upcoming according to existing service rule
- `now < checkinClosesAt` required for mutation
- Reject reason maps to existing `AuthError` statuses and messages

---

## State Transitions

### UI check-in window transitions

1. `PreOpen` -> `Open` when `now` reaches `checkinOpensAt`
2. `Open` -> `Closed` when `now` reaches `checkinClosesAt`
3. `Open` retains live countdown and per-second updates until closed

### Action label/message transitions

1. `PreOpen`: button label `Check-in starts soon`, supporting message may include countdown to open
2. `Open`: action buttons enabled per eligibility; supporting message shows `Check-in period ends in ...` (second-level)
3. `Closed`: action buttons disabled; supporting message indicates closed period

---

## Backward Compatibility Notes

- Existing API and socket payload contracts remain additive/compatible.
- `canCheckin` semantics continue to be used; same-day frontend filter is removed.
- Existing mutation error responses remain valid and are reused by UI.
