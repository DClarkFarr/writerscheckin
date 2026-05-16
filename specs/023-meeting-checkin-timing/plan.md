# Implementation Plan: Meeting Check-in Timing

**Branch**: `023-meeting-checkin-timing` | **Date**: May 16, 2026 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/023-meeting-checkin-timing/spec.md`

## Summary

Enable attendees to check in during the full open window (even if meeting date is on a later calendar day), display live second-by-second countdown updates, allow post-period status downgrades while preventing upgrades, and give group admins unrestricted manual status upgrade capability regardless of window state.

**Technical Approach**:

- Backend: Update `meetingCheckinService` validation to check timestamps (not calendar dates); add status change authorization layer supporting attendee downgrades and admin upgrades
- Data: Add `changedBy` and `isAdminOverride` fields to `meetingAttendees` to track change source; add `startCheckinHoursAfterCreation` to meetings table
- Frontend: Implement per-second countdown timer using `setInterval` with ref-based state updates; add UI logic to disable buttons based on window state and user role
- UI/UX: Add hover tooltips explaining closed window restrictions; stabilize button labels (remove countdown from button text)

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)  
**Backend**: Node.js 20+, Express 5, MongoDB 6.x (native driver), dayjs for date handling  
**Frontend**: React 19, TypeScript 5.9 (strict), Vite 8, TanStack Query v5, Zustand, Tailwind CSS v4, ShadCN UI, TipTap  
**Storage**: MongoDB collections: `meetings`, `meetingAttendees`, `meetingAttendanceLogs`  
**Testing**: Backend integration tests via Jest + MongoDB fixtures; Frontend component tests + integration tests  
**Target Platform**: Web (React SPA + Express backend)  
**Project Type**: Full-stack web service with real-time features (Socket.io ready)  
**Performance Goals**: Sub-100ms API responses; countdown updates ≤16ms frame budget (60 fps)  
**Constraints**: Attendee downgrades forbidden while period open; admin upgrades unrestricted; last-write-wins for concurrent status changes  
**Scale/Scope**: Multi-tenant groups with 10-1000 attendees per meeting; real-time status aggregates on 50+ concurrent viewers

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **Principle I (Strict TypeScript)**: All new code in TypeScript strict mode. No type assertions except proven-correct cases. Use `@/` path alias for frontend.

✅ **Principle II (Layered Backend Architecture)**:

- Models layer: Only `meetingAttendees.ts` touches MongoDB for attendee data; new fields tracked in model
- Services layer: `meetingCheckinService.ts` enforces business rules (downgrade only when closed; admin upgrades unrestricted)
- Routers layer: Existing or new check-in routes extract auth context and call service functions
- Utils layer: New helpers `isCheckinPeriodOpen()`, `canDowngradeStatus()`, `canAdminUpgradeStatus()` added to validators

✅ **Principle III (Centralized Error Handling)**: All service-layer validation throws `ValidationError` or `AuthError`; routers use `handleAsync()` wrapper

✅ **Principle IV (Frontend Query Hooks)**: TanStack Query mutations for status changes; optimistic updates with rollback on error

✅ **Principle V (Session-based Auth)**: Group admin check via `req.session` cast to `AuthSession`; membership validation required before any status change

✅ **Principle VI (Timestamp-based Logic)**: Check-in window validation uses `occursAt`, `startCheckinHoursAfterCreation`, `endCheckinHoursBefore` (not calendar date comparison)

## Project Structure

### Documentation (this feature)

```text
specs/023-meeting-checkin-timing/
├── plan.md                  # This file
├── research.md              # Phase 0 (completed via research tasks)
├── data-model.md            # Phase 1 (new: attendee tracking, timestamp fields)
├── quickstart.md            # Phase 1 (integration guide)
├── contracts/
│   └── meeting-checkin-api.md   # API contract updates
├── spec.md                  # Original feature specification
├── tasks.md                 # Phase 2 (implementation tasks)
└── checklists/
    └── requirements.md      # Acceptance test checklist
```

### Source Code (monorepo)

```text
express/
├── src/
│   ├── models/
│   │   ├── groupMeetings.ts      # Update: add startCheckinHoursAfterCreation field
│   │   └── meetingAttendees.ts   # Update: add changedBy, isAdminOverride fields
│   ├── services/
│   │   └── meetingCheckinService.ts  # Update: downgrade/upgrade validation logic
│   ├── routers/
│   │   └── meetingsRouter.ts      # Update: add admin upgrade endpoint if needed
│   └── utils/
│       ├── validators.ts          # Add: canDowngradeStatus, canAdminUpgradeStatus helpers
│       └── errorHandler.ts        # (no changes; reuse existing error mapping)
└── tests/
    ├── unit/
    │   └── meetingCheckinService.test.ts   # New: downgrade/upgrade validation
    └── integration/
        └── meetingCheckin.integration.test.ts  # New: end-to-end scenarios

web/
├── src/
│   ├── components/
│   │   └── MeetingCheckinButton.tsx     # Update: disable/enable based on window + role
│   │   └── CheckinStatusPicker.tsx      # Update: filter valid transitions + admin mode
│   ├── hooks/
│   │   ├── useCheckinWindowState.ts     # New: calculate window open/closed state
│   │   ├── useMeetingCheckinTimer.ts    # New: per-second countdown updates
│   │   └── useMeetingAdminStatus.ts     # New: check if user is admin
│   ├── lib/
│   │   └── checkinWindowMessage.ts      # New/Update: generate UI messages based on state
│   └── pages/
│       └── MeetingDetail.tsx            # Update: integrate new hooks
└── tests/
    └── components/
        └── MeetingCheckinButton.test.tsx  # New: button state transitions
```

## Phase 0: Research & Clarification

All technical details from specification are clear; no NEEDS CLARIFICATION items.

**Key Findings**:

1. Check-in window determined by `occursAt` timestamp + `startCheckinHoursAfterCreation` + `endCheckinHoursBefore` (calendar date NOT a factor)
2. Status hierarchy: `reading` > `attending` > `skipping`; downgrades allowed when period closed, upgrades only by admin
3. Countdown display must update every second client-side (no server polling)
4. Admin upgrade unrestricted by window state; attendee downgrade restricted to post-close only
5. Concurrent updates: last write wins; both attendee downgrade and admin upgrade can coexist

## Complexity Tracking

No constitution violations requiring justification. Architecture aligns with existing layered backend, Query hook patterns, and error handling centralization.
