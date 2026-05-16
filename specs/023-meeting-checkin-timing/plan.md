# Implementation Plan: Meeting Check-in Timing

**Branch**: `023-realtime-meeting-updates` | **Date**: May 16, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/023-meeting-checkin-timing/spec.md`

## Summary

Align meeting check-in eligibility and UI timing behavior with check-in window timestamps instead of same-day meeting gating. Backend check-in validation will continue to enforce upcoming-meeting plus check-in-close constraints, while frontend meeting feed/detail surfaces will remove day-of-meeting blockers, run live second-level countdown updates in supporting text, and keep action button labels static (no embedded countdown text).

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query v5, dayjs/date formatting helpers
**Storage**: MongoDB (`groupMeetings`, `groupMembers`, `meetingCheckins`, `meetingAttendees`)
**Testing**: `cd express && npm run build`, `cd web && npx tsc --noEmit`, manual UI timing checks for second-level countdown and state transitions
**Target Platform**: Monorepo web app (Express API + React SPA)
**Project Type**: Full-stack web application feature adjustment (eligibility + UI behavior)
**Performance Goals**: Countdown display updates once per second with stable rendering while visible; no unnecessary refetches for per-second updates
**Constraints**: Preserve backend layered architecture; preserve query-hook ownership and avoid direct API calls from UI components; avoid introducing timing logic drift between feed and detail views
**Scale/Scope**: 1 check-in eligibility path (`meetingCheckinService`), 2 primary UI surfaces (`MeetingFeedItem`, `group-meeting-view`), and shared formatting/derived-state helpers

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                     |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | Changes are within existing typed service/hooks/component boundaries.                                     |
| II. Layered Backend Architecture              | PASS   | Check-in rule changes remain in service layer with model calls unchanged.                                 |
| III. Centralized Error Handling               | PASS   | Existing `AuthError` and router error mapping remain in use.                                              |
| IV. Security-First Implementation             | PASS   | Membership and accepted-status checks remain required for check-in updates.                               |
| VIII. API Client & Data Fetching              | PASS   | No new REST endpoints; existing query and mutation contracts remain.                                      |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | UI behavior updates remain in component/hook and formatter layers with existing query ownership patterns. |

**Post-Design Re-Check**: PASS. Phase 1 artifacts keep logic within service/hook/component responsibilities and do not violate constitution constraints.

## Project Structure

### Documentation (this feature)

```text
specs/023-meeting-checkin-timing/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── checkin-eligibility-contract.md
│   └── meeting-feed-checkin-ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── services/
    │   ├── meetingCheckinService.ts
    │   └── groupMeetingsService.ts
    └── routers/
        └── groupsRouter.ts

web/
└── src/
    ├── components/
    │   └── home/
    │       └── MeetingFeedItem.tsx
    ├── pages/
    │   └── group-meeting-view.tsx
    ├── hooks/
    │   └── useMemberMeetingDerivedState.ts
    ├── lib/
    │   ├── checkinWindowMessage.ts
    │   └── dateFormat.ts
    └── queries/
        └── useMeetingCheckinMutation.ts
```

**Structure Decision**: Keep current backend validation in `meetingCheckinService.ts` and harmonize frontend behavior by consolidating countdown + availability display rules in `MeetingFeedItem.tsx`, `group-meeting-view.tsx`, and `checkinWindowMessage.ts`.

## Phase 0: Research

Research completed for:

1. Existing eligibility constraints that currently block check-in based on same-day UI gating.
2. Best way to represent check-in open/close messaging without putting countdown text into button labels.
3. Reliable second-level countdown updates without introducing stale intervals or excessive rerenders.
4. Shared contract between feed and detail views to keep behavior consistent.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design outputs:

1. [data-model.md](data-model.md): timing entities and UI state transitions for check-in windows.
2. [contracts/checkin-eligibility-contract.md](contracts/checkin-eligibility-contract.md): service-level check-in eligibility rules.
3. [contracts/meeting-feed-checkin-ui-contract.md](contracts/meeting-feed-checkin-ui-contract.md): button-label and countdown-display contract for feed/detail UI.
4. [quickstart.md](quickstart.md): implementation order, verification flow, and rollout checklist.
5. Agent context update in `.github/copilot-instructions.md` to reference this plan.

## Phase 2: Task Planning Preview

Planned `/speckit.tasks` decomposition focus:

1. Remove same-day check-in gating in `MeetingFeedItem` and `group-meeting-view`; derive availability from check-in window state and existing `canCheckin` flags.
2. Update disabled reason text to remove day-of-meeting-only messaging.
3. Ensure countdown updates every second while check-in period is open, including cross-day windows.
4. Keep `check-in starts soon` as static pre-window button label and move all countdown wording into supporting text below.
5. Harmonize `formatCheckinWindowMessage` for active-window countdown behavior and boundary transitions.
6. Validate backend/service check-in closing behavior still returns consistent conflict errors when closed.
7. Run build/typecheck and execute manual timestamp-boundary validation scenarios.

## Complexity Tracking

No constitution violations or exemptions required.
