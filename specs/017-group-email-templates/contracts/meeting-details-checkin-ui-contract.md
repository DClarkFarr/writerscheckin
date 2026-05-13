# Contract: Meeting Details Check-In UI

## Purpose

Define check-in behavior on meeting details page to match the existing meeting card interaction pattern.

## Scope

- Frontend details page: meeting view route and related components/hooks.
- Existing backend endpoint remains source of truth for check-in updates.

## Input data contract

- From meeting detail query:
  - `meetingId`
  - `userCheckinState`
  - `canCheckin`
  - `attendingCount`
  - `readingCount`
- From check-in mutation:
  - updated `userCheckinState`
  - updated counts and applied timestamp

## Behavioral contract

1. Show check-in actions for states: `attending`, `reading`, `not_attending`.
2. Use same enable/disable logic as meeting card check-in behavior.
3. Use existing check-in mutation endpoint; no direct API calls from component.
4. Reflect mutation results in UI state and counts immediately via query invalidation/update pattern already used by meeting card flows.

## UX contract

- Control labels and state semantics align with meeting card check-in controls.
- If `canCheckin` is false, controls are disabled and helper text explains unavailable state.
- Check-in controls must be visible on meeting details page without requiring navigation back to cards.

## Error contract

- Mutation failures surface user-friendly error feedback using existing frontend error handling patterns.
