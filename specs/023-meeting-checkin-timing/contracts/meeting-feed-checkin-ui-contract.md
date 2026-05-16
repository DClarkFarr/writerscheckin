# Contract: Meeting Feed Check-in UI

## Scope

Defines UI behavior for check-in actions and timing text in meeting feed and meeting detail views.

## Surfaces

- `web/src/components/home/MeetingFeedItem.tsx`
- `web/src/pages/group-meeting-view.tsx`

## Display Rules

1. Before check-in opens:

- Action button label is static `Check-in starts soon`.
- Action button label must remain exactly `Check-in starts soon` (no timer suffix).
- Button label never includes countdown values.
- Supporting text below buttons may show timing context.

2. While check-in is open:

- Supporting text shows `Check-in period ends in ...` and updates every second.
- Action controls use eligibility state without day-of-meeting-only gating.

3. After check-in closes:

- Action controls are disabled.
- Supporting text indicates that the period has closed.

## Timer Rules

- Countdown refresh interval: 1000 ms.
- Timer runs only while countdown text is visible/actionable.
- Timer is cleared at close boundary and on component unmount.

## Consistency Rules

- Feed and detail surfaces must apply equivalent availability and messaging semantics.
- Shared formatter (`checkinWindowMessage`) is the preferred source for countdown/closed wording.
- Any text that says check-in is only available on the meeting day is prohibited.
- Supporting countdown copy must never be moved into action button labels.

## Accessibility and UX Rules

- Button labels must remain short and action-oriented.
- Dynamic timing information belongs in nearby descriptive text, not embedded in action labels.
- State transitions (pre-open -> open -> closed) should be visible without page reload.
