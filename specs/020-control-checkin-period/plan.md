# Implementation Plan: Control Check-In Period

**Branch**: `020-user-profile-settings` | **Date**: May 14, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/020-control-checkin-period/spec.md`

## Summary

Add a new group-level numeric setting that defines when check-in closes before meeting start (`endCheckinHoursBefore`), ensure newly created meetings inherit that value, and enforce check-in cutoff in both read and write paths. Every check-in action surface must show cutoff messaging, and disabled actions must explain cutoff expiration.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query v5, TanStack Router, dayjs, ShadCN UI  
**Storage**: MongoDB collections `groups`, `groupMeetings`, `meetingAttendees` (no new collections)  
**Testing**: `cd express && npm run build`, `cd web && npx tsc --noEmit`, manual check-in cutoff UI/endpoint validation scenarios  
**Target Platform**: Monorepo web app (Express API + React SPA)  
**Project Type**: Full-stack web application feature (backend + frontend)  
**Performance Goals**: Check-in availability evaluation remains O(1) per meeting and does not add additional DB round trips in detail/feed endpoints  
**Constraints**: Layered backend architecture; strict type safety; session-authenticated endpoint behavior unchanged; dayjs-based date handling in frontend; no breaking changes to existing group form aliases (`publicMessage`, `attendanceMessage`)  
**Scale/Scope**: One new numeric default on groups, one inherited field on meetings, check-in endpoint cutoff validation, and message/tooltip updates across all check-in button surfaces

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                      |
| --------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | New DTO fields and response shapes remain fully typed across Express/Web.                                  |
| II. Layered Backend Architecture              | PASS   | Persistence in models, business logic in services, routing/session extraction in router only.              |
| III. Centralized Error Handling               | PASS   | Check-in cutoff violations surfaced as service-thrown errors handled by existing error pipeline.           |
| IV. Security-First Implementation             | PASS   | Existing session/membership authorization remains required for check-in updates.                           |
| V. Environment Configuration                  | PASS   | No new environment variables required.                                                                     |
| VI. Frontend Hook + Component Separation      | PASS   | Group form and meeting UI updates stay in hooks/components boundaries.                                     |
| VII. File-Based Routing                       | PASS   | No routing pattern changes required.                                                                       |
| VIII. API Client & Data Fetching              | PASS   | API changes remain in typed `web/src/api` and existing query hooks.                                        |
| IX. Audit Logging                             | PASS   | No new sensitive auth action introduced.                                                                   |
| X. Date Formatting & Time Utilities           | PASS   | Check-in cutoff display uses existing centralized date/time utilities and dayjs where already established. |
| XI. Product Design Imperatives                | PASS   | Check-in remains prominent action; disabled-state messaging increases clarity.                             |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | Existing query hook mutation usage remains source of check-in updates.                                     |

**Post-Design Re-Check**: PASS. Design artifacts preserve layering, typed API contracts, and existing UI architecture constraints while adding cutoff logic.

## Project Structure

### Documentation (this feature)

```text
specs/020-control-checkin-period/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── group-checkin-policy-contract.md
│   ├── meeting-inheritance-contract.md
│   └── meeting-checkin-cutoff-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groups.ts
    │   └── groupMeetings.ts
    ├── services/
    │   ├── groupsService.ts
    │   ├── groupMeetingsService.ts
    │   └── meetingCheckinService.ts
    └── routers/
        └── groupsRouter.ts

web/
└── src/
    ├── api/
    │   ├── groups.ts
    │   └── types/groups.ts
    ├── hooks/
    │   ├── useGroupForm.ts
    │   └── useMemberMeetingDerivedState.ts
    ├── pages/
    │   └── group-meeting-view.tsx
    └── components/
        ├── forms/GroupForm.tsx
        └── home/
            ├── MeetingFeedItem.tsx
            └── MeetingCheckinDrawer.tsx
```

**Structure Decision**: Extend existing group and meeting defaults model pattern (similar to `publishHoursBefore` and `notifyAttendanceHoursBefore`) by adding `endCheckinHoursBefore` at group + meeting level, applying inheritance in `createUpcomingMeetingFromDefaults`, and centralizing cutoff enforcement in service-level check-in logic.

## Phase 0: Research

Research completed for:

1. Storage location and naming for check-in cutoff defaults in groups/meetings.
2. Inheritance point for meeting creation from group defaults.
3. Check-in cutoff computation and timezone handling strategy.
4. API error behavior for cutoff-expired check-in requests.
5. UI formatting rules for same-day countdown vs next-day absolute datetime messaging.
6. Existing check-in button surfaces that must show time-limit messaging.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design outputs:

1. [data-model.md](data-model.md): Group and meeting schema additions, validation rules, derived cutoff timestamps, and state transitions for check-in eligibility.
2. [contracts/group-checkin-policy-contract.md](contracts/group-checkin-policy-contract.md): Group read/update contract including new `endCheckinHoursBefore` field.
3. [contracts/meeting-inheritance-contract.md](contracts/meeting-inheritance-contract.md): Meeting creation inheritance contract for `endCheckinHoursBefore` from group defaults.
4. [contracts/meeting-checkin-cutoff-contract.md](contracts/meeting-checkin-cutoff-contract.md): Check-in endpoint contract for cutoff validation and error semantics.
5. [quickstart.md](quickstart.md): Implementation and validation walk-through.
6. Update `.github/copilot-instructions.md` SPECKIT context pointer to this feature plan.

## Phase 2: Task Planning Preview

Planned `/speckit.tasks` decomposition focus:

1. Backend schema + model validation updates for group and meeting fields.
2. Service-layer inheritance and check-in eligibility calculations.
3. Router/request DTO updates for group create/edit and check-in endpoint behavior.
4. Frontend group form field and API type propagation.
5. Frontend check-in messaging/tooltip updates on all check-in button surfaces.
6. End-to-end verification scenarios for cutoff-before-start disable behavior.

## Complexity Tracking

No constitution violations or exemptions required.
