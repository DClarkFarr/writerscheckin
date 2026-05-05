# Implementation Plan: Cancel Published Meetings

**Branch**: `[013-cancel-events]` | **Date**: 2026-05-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-cancel-events/spec.md`

## Summary

Add a meeting cancellation capability for admins by extending meeting persistence with `cancelledAt: string | null`, introducing a cancel action alongside existing publish entry points (feed dropdown and meeting form), enforcing a confirmation dialog that warns RSVP'd members are notified, and deriving canceled-state UI behavior so canceled meetings remain queryable but non-editable and non-checkin-eligible.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query v5, TanStack Router, Axios API modules, dayjs date utilities, ShadCN UI primitives  
**Storage**: MongoDB documents in `groupMeetings`, related attendee data in `meetingAttendees`, frontend query cache in browser memory  
**Testing**: `cd express && npm run build`, `cd web && npm run lint`, `cd web && npm run build`, `cd web && npx tsc --noEmit`, plus manual verification of cancellation flows in feed and meeting form  
**Target Platform**: Same-origin Express API plus React SPA in monorepo deployment  
**Project Type**: Monorepo web application with backend model/service/router layers and frontend API/query/component layers  
**Performance Goals**: Preserve current pagination and query performance by continuing to include canceled rows in normal list queries without extra per-row fetches  
**Constraints**: MongoDB access remains model-owned per constitution; canceled meetings remain in normal meeting datasets; canceled meetings cannot be checked in, edited, re-published, or changed; canceled card visuals must use dark orange plus gray tone while preserving accessibility  
**Scale/Scope**: Meeting model/types, publish/cancel router-service paths, meeting form and feed actions, derived-state hooks, and check-in guards for existing meeting views

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                                                             |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| II. Layered Backend Architecture              | PASS   | Cancellation persistence and query changes are planned in model helpers, with services orchestrating only business rules and serialization.       |
| I. Strict TypeScript Throughout               | PASS   | `cancelledAt` and expanded status union are propagated through shared backend/frontend contracts.                                                 |
| VIII. API Client & Data Fetching              | PASS   | Frontend changes stay behind existing API modules and query hooks; no direct component API calls.                                                 |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | New cancel mutation is scoped to query hooks with query-key ownership retained by hook helpers.                                                   |
| X. Date Formatting & Time Utilities           | PASS   | `cancelledAt` is persisted/serialized as ISO-like date strings and rendered through shared date helpers.                                          |
| XI. Product Design Imperatives                | PASS   | Canceled-state dark orange/gray theme is applied within existing card UX and interaction constraints while keeping controls clear and accessible. |

**Post-Design Re-Check**: PASS. Design artifacts keep model-layer MongoDB access, preserve query-hook ownership, and encode canceled-state UI behavior as derived frontend state rather than ad hoc per-component logic.

## Project Structure

### Documentation (this feature)

```text
specs/013-cancel-events/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── meeting-cancellation-contract.md
│   └── cancelled-meeting-ui-state-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groupModelCommon.ts
    │   └── groupMeetings.ts
    ├── services/
    │   └── groupMeetingsService.ts
    └── routers/
        └── groupsRouter.ts

web/
└── src/
    ├── api/
    │   ├── groups.ts
    │   └── types/groups.ts
    ├── components/
    │   ├── forms/MeetingForm.tsx
    │   └── home/MeetingFeedItem.tsx
    ├── hooks/
    │   ├── useMeetingForm.ts
    │   └── useMemberMeetingDerivedState.ts
    ├── pages/
    │   ├── group-meeting-edit.tsx
    │   └── group-meeting-view.tsx
    └── queries/
        ├── useMeetingCheckinMutation.ts
        ├── useMyMeetingsQuery.ts
        ├── usePublishMeetingMutation.ts
        └── useCancelMeetingMutation.ts
```

**Structure Decision**: Keep cancellation persistence and status transitions in backend models/services/routers, then update shared frontend API contracts and query hooks to enforce canceled-state restrictions consistently across feed, form, and check-in surfaces.

## Phase 0: Research

Research resolves the following implementation decisions:

1. How to evolve meeting lifecycle state from `draft | published` to include canceled semantics while preserving existing publish workflows.
2. Whether `cancelledAt` should be a nullable persisted date field versus inferred from status change metadata.
3. How to ensure canceled meetings are still returned by existing list and detail queries without introducing separate filters.
4. How to apply dark orange and gray canceled UI tone while keeping interaction and contrast requirements from the constitution.
5. How to guarantee admin edit restrictions and member check-in restrictions are enforced in both backend business logic and frontend affordances.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): meeting entity updates (`status`, `cancelledAt`), cancellation transition rules, and derived UI capability fields.
2. [contracts/meeting-cancellation-contract.md](contracts/meeting-cancellation-contract.md): cancel endpoint behavior, guardrails, and response semantics.
3. [contracts/cancelled-meeting-ui-state-contract.md](contracts/cancelled-meeting-ui-state-contract.md): frontend action-visibility and disabled-state contract for canceled meetings.
4. [quickstart.md](quickstart.md): implementation order and verification checklist.
5. Update `.github/copilot-instructions.md` so SPECKIT plan context references this plan.

## Complexity Tracking

No constitution violations or exceptions are required for this feature.
