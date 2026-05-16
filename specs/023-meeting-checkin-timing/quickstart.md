# Quickstart: Meeting Check-in Timing

## Goal

Allow check-in as soon as the check-in window opens (even on prior days), display check-in countdown updates every second in supporting text, and keep button labels static without embedded countdown content.

## Implementation Order

1. Confirm and align eligibility boundaries

- Review `meetingCheckinService.ts` check-in-close validation and ensure it remains the authoritative mutation guard.
- Confirm frontend derives `canCheckin` from backend/state without same-day date checks.

2. Remove same-day UI gating

- Update [web/src/components/home/MeetingFeedItem.tsx](web/src/components/home/MeetingFeedItem.tsx) to remove `isMeetingDayToday` from `canCheckinNow` computation.
- Update [web/src/pages/group-meeting-view.tsx](web/src/pages/group-meeting-view.tsx) to remove day-of-meeting gating and day-only disabled message.

3. Enforce button label vs countdown separation

- Keep pre-window button label static as `Check-in starts soon`.
- Ensure countdown text is rendered only in supporting text below action controls.

4. Make countdown update every second while active

- Ensure feed and detail views run one-second interval updates while check-in window is active/open.
- Stop intervals at close and on unmount.

5. Harmonize window messages

- Update shared message formatter in [web/src/lib/checkinWindowMessage.ts](web/src/lib/checkinWindowMessage.ts) if needed so active windows consistently show second-level countdown text.
- Ensure wording removes day-of-meeting-only language.

6. Validate mutation and cache behavior

- Verify `useMeetingCheckinMutation` optimistic/update flow remains intact when check-in opens on prior day.
- Verify UI transitions at boundaries (`pre-open`, `open`, `closed`) without refresh.

## Manual Validation Scenarios

1. Cross-day open window

- Set a meeting with check-in open at least 24-48 hours before `occursAt`.
- Confirm check-in controls become usable immediately at open time, even if meeting is on another day.

2. Live second countdown

- During active window, observe message text for at least 10 seconds.
- Confirm seconds decrement each second and do not stall.

3. Static pre-window button label

- Before open time, verify button reads `Check-in starts soon` with no countdown in button text.
- Confirm countdown/timing details appear only in supporting text below.

4. Close boundary

- At or just after `checkinClosesAt`, verify controls disable and message shows closed state.
- Attempt mutation and confirm existing conflict behavior remains.

5. Feed/detail consistency

- Compare same meeting in My Meetings feed and detail page.
- Confirm matching availability and message semantics.

## Build Checks

- `cd express && npm run build`
- `cd web && npx tsc --noEmit`

## Notes

- Keep business validation in backend service layer; frontend behavior should mirror backend constraints but not replace them.

## Validation Notes (May 16, 2026)

- Backend compile validation passed: `cd express && npm run build`.
- Frontend typecheck validation passed: `cd web && npx tsc --noEmit`.
- Manual validation scenarios remain pending.
