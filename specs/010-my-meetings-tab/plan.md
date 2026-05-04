# Implementation Plan: My Meetings Tab

**Branch**: `010-create-feature-branch` | **Date**: 2026-05-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-my-meetings-tab/spec.md`

## Summary

Build a new home-page My Meetings experience that returns standardized meeting response objects, shows upcoming first then past, supports infinite scrolling, and lets users set attendance states through a check-in drawer with optimistic updates. Members receive published meetings only (next upcoming per group plus past history), while admins/owners also receive upcoming draft meetings marked with an admin-only badge and hidden-eye icon.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: React 19, TanStack Query v5, TanStack Router, Axios API modules, Express 5, MongoDB native driver, dayjs, shadcn/ui Drawer and Badge primitives  
**Storage**: MongoDB backend records for meetings and attendance/check-in state; TanStack Query cache in browser memory  
**Testing**: `cd express && npm run build`, `cd web && npm run build`, `cd web && npm run lint`, plus manual check-in drawer and optimistic rollback verification  
**Target Platform**: Same-origin web SPA (`web/`) with Express API (`express/`)  
**Project Type**: Monorepo web application with backend contracts and frontend query/UI changes  
**Performance Goals**: Initial My Meetings view renders first page promptly; incremental loads append without resetting existing items; optimistic check-in state appears immediately after selection  
**Constraints**: Must obey Constitution Principles II, VIII, X, XI, and XII; role-based visibility must be enforced server-side; query hooks own keys and optimistic mutation logic; standardized response shape must be shared across upcoming, draft, and past items  
**Scale/Scope**: Home My Meetings tab, meeting feed endpoint(s), check-in mutation endpoint(s), frontend API types, query hooks, drawer UI, badges/icons, and infinite pagination behavior

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                                       |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| II. Layered Backend Architecture              | PASS   | Contract changes remain model/service/router separated; no direct DB access from routers/services outside model layer APIs. |
| VIII. API Client & Data Fetching              | PASS   | HTTP access remains in `web/src/api/*`; query wrappers consume typed API functions.                                         |
| X. Date Formatting & Time Utilities           | PASS   | Feed date rendering will use existing centralized date formatting utilities with dayjs-backed helpers.                      |
| XI. Product Design Imperatives                | PASS   | Card-based rows, clear badge roles, and mobile-first drawer flow align with non-negotiable UX constraints.                  |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | New meeting feed and check-in flows are query/mutation hook owned with `.key` methods and optimistic update defaults.       |

**Post-Design Re-Check**: PASS. Design artifacts keep standardized API contracts, hook-based optimistic mutation ownership, and role-based meeting visibility enforcement.

## Project Structure

### Documentation (this feature)

```text
specs/010-my-meetings-tab/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── my-meetings-read-contract.md
│   └── my-meetings-query-hooks-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groupMeetings.ts
    │   ├── meetingCheckins.ts
    │   └── groups.ts
    ├── services/
    │   ├── groupMeetingsService.ts
    │   ├── meetingCheckinService.ts
    │   └── groupsService.ts
    └── routers/
        └── groupsRouter.ts

web/
└── src/
    ├── api/
    │   ├── groups.ts
    │   └── types/groups.ts
    ├── components/
    │   ├── home/
    │   │   ├── MyMeetingsTab.tsx
    │   │   ├── MeetingFeedItem.tsx
    │   │   └── MeetingCheckinDrawer.tsx
    │   └── ui/
    │       └── badge.tsx
    ├── hooks/
    │   └── useMeetingCheckinDrawer.ts
    ├── queries/
    │   ├── useMyMeetingsQuery.ts
    │   └── useMeetingCheckinMutation.ts
    └── lib/
        └── dateFormat.ts
```

**Structure Decision**: Keep backend meeting visibility and standardized DTO shaping in `express/src/models` and `express/src/services`, expose them through `groupsRouter`, and centralize frontend orchestration in `web/src/api/*` plus `web/src/queries/*` wrappers so components render only presentational state.

## Phase 0: Research

Research resolves the following implementation decisions:

1. Standardized meeting response object schema shared by upcoming, draft, and past feed rows.
2. Role-based visibility and ordering behavior: member vs admin/owner rules for upcoming and past segments.
3. Optimistic mutation pattern for check-in updates with deterministic rollback.
4. Drawer interaction contract for check-in choices (`attending`, `reading`, `not attending`) and badge synchronization.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): feed entities, check-in states, and optimistic state transitions.
2. [contracts/my-meetings-read-contract.md](contracts/my-meetings-read-contract.md): standardized meeting list and check-in update response contracts.
3. [contracts/my-meetings-query-hooks-contract.md](contracts/my-meetings-query-hooks-contract.md): query and optimistic mutation hook responsibilities.
4. [quickstart.md](quickstart.md): implementation order and verification checklist.
5. Update `.github/copilot-instructions.md` plan pointer to this feature.

## Complexity Tracking

No constitution violations or exceptions are required for this feature.
