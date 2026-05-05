# Contract: Cancelled Meeting UI State

## Purpose

Define frontend behavior for canceled meetings across feed cards, meeting form, and check-in affordances.

## Inputs

- Shared meeting response object that includes:
  - `status: "draft" | "published" | "cancelled"`
  - `cancelledAt: string | null`
  - existing scheduling and role context used by derived selectors

## Required derived selectors

- `isCancelledMeeting(item)`:
  - true when `item.status === "cancelled"`.
- `canCheckInToMemberMeeting(item, now)`:
  - must return false for canceled meetings regardless of time.
- `canEditMemberMeeting(item, roleContext)`:
  - must return false for canceled meetings regardless of admin role.
- `getMemberMeetingDisplayTone(item, now)`:
  - must return canceled tone mapping (dark orange + gray) when canceled.

## Action visibility contract

- Feed item dropdown:
  - Show `Cancel meeting` action only for cancel-eligible published meetings.
  - Do not show `Cancel meeting` for draft/canceled meetings.
- Meeting form publish/cancel area:
  - Show publish card only for draft meetings.
  - Replace publish card with cancellation card for published meetings.
  - Show non-editable canceled state messaging for canceled meetings.

## Confirmation dialog contract

- Triggering cancel must open a confirmation dialog.
- Dialog copy must state that all RSVP'd members will be notified.
- Confirm executes cancel mutation.
- Dismiss/close does not mutate meeting.
- While mutation is pending, confirm control is disabled and duplicate submits are blocked.

## Check-in and edit restrictions

- Canceled meetings must not render active check-in actions.
- Canceled meetings must render edit affordances as unavailable.
- Any stale cached action state is corrected after mutation success via query invalidation.

## Visual contract

- Canceled meeting cards use dark orange and gray theme tokens for border/bookend/background combinations.
- Canceled badges and labels use the same semantic palette.
- Disabled controls remain legible and maintain required contrast.
