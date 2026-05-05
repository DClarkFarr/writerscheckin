# Implementation Plan: Meetings Mine Aggregation Alignment

**Branch**: `012-update-meetings-mine-types` | **Date**: 2026-05-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-update-meetings-mine-types/spec.md`

## Summary

Replace the stale `MyMeetingFeedItem` contract with a `MemberMeetingFeedItem` that matches the aggregation-backed `/groups/meetings/mine` response, enrich paginated meeting rows with `counts` and current-user `attendance` before serialization, and move UI-only flags such as `segment`, `isAdminOnly`, `showAdminOnlyBadge`, and `canCheckin` into frontend-derived selectors and hooks.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query v5, TanStack Router, Axios API modules, dayjs date utilities  
**Storage**: MongoDB collections for `groupMeetings`, `groupMembers`, and `meetingAttendees`; TanStack Query cache in browser memory  
**Testing**: `cd express && npm run build`, `cd web && npm run lint`, `cd web && npm run build`, targeted `npx tsc --noEmit` in `web/`, plus manual verification of my meetings rendering, pagination, and check-in flows  
**Target Platform**: Same-origin Express API plus React SPA in the monorepo  
**Project Type**: Monorepo web application with backend models/services/routers and frontend API/query/component layers  
**Performance Goals**: Preserve cursor-based pagination, avoid per-meeting count lookups by using one aggregate-by-meeting-ids query per page, and keep derived UI state computation local and cheap in the client  
**Constraints**: MongoDB access must remain model-owned per constitution, `/groups/meetings/mine` must keep document-like response structure, server must stop emitting UI-derived booleans, and cursor ordering must remain stable on `occursAt` plus `_id`  
**Scale/Scope**: One backend endpoint and its aggregation helpers, one shared frontend contract, the my meetings query/mutation layer, and the home-tab card/drawer consumers that currently rely on the old feed type

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                                                                 |
| --------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| II. Layered Backend Architecture              | PASS   | Plan moves the current aggregation execution and attendee-count aggregation behind model helpers so services stop calling `getCollection()` directly. |
| I. Strict TypeScript Throughout               | PASS   | Contract rename and response-shape alignment are fully typed across Express and React.                                                                |
| VIII. API Client & Data Fetching              | PASS   | Frontend continues to consume `/groups/meetings/mine` only through `web/src/api/groups.ts` and query wrappers.                                        |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | Query hooks retain ownership of cache keys and optimistic updates while derived UI selectors remain component- or hook-level only.                    |
| X. Date Formatting & Time Utilities           | PASS   | `segment` and related temporal UI state will be derived from ISO `occursAt` values using centralized frontend date utilities.                         |
| XI. Product Design Imperatives                | PASS   | Existing my meetings card/drawer UX stays intact while state derivation shifts from server to client.                                                 |

**Post-Design Re-Check**: PASS. Design artifacts keep database access in models, preserve query-hook ownership, and move display-only logic out of the API contract.

## Project Structure

### Documentation (this feature)

```text
specs/012-update-meetings-mine-types/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── member-meetings-mine-contract.md
│   └── member-meeting-derived-state-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groupMeetings.ts
    │   ├── meetingAttendees.ts
    │   └── meetingCheckins.ts
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
    │   └── home/
    │       ├── MeetingCheckinDrawer.tsx
    │       ├── MeetingFeedItem.tsx
    │       └── MyMeetingsTab.tsx
    ├── hooks/
    │   └── useMeetingCheckinDrawer.ts
    ├── lib/
    │   └── dateFormat.ts
    └── queries/
        ├── useMeetingCheckinMutation.ts
        └── useMyMeetingsQuery.ts
```

**Structure Decision**: Keep MongoDB pipeline and aggregate helpers in `express/src/models`, use `express/src/services/groupMeetingsService.ts` only for orchestration and response serialization, and update the frontend contract in `web/src/api/types/groups.ts` plus the my-meetings query/card/mutation consumers to compute UI-only state locally.

## Phase 0: Research

Research resolves the following implementation decisions:

1. Rename the shared list item contract from `MyMeetingFeedItem` to `MemberMeetingFeedItem` and align it to the aggregation response object instead of the legacy server-derived DTO.
2. Add a service-level `populateMeetingsWithCounts()` enrichment step backed by a model aggregate helper so `counts` are attached before serialization without N+1 queries.
3. Extend the paginated aggregation flow with a current-user attendee lookup after cursor filtering so each row can expose `attendance` directly.
4. Move `segment`, `isAdminOnly`, `showAdminOnlyBadge`, and `canCheckin` into frontend selectors or hooks and keep API responses close to persisted document shape.
5. Preserve stable cursor pagination and optimistic check-in updates after the response shape changes from `items`-style DTOs to `rows` of aggregation-backed documents.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): `MemberMeetingAggregationItem`, enriched count and attendance state, shared API response shape, and frontend-derived state model.
2. [contracts/member-meetings-mine-contract.md](contracts/member-meetings-mine-contract.md): `/groups/meetings/mine` request, response, ordering, and enrichment contract.
3. [contracts/member-meeting-derived-state-contract.md](contracts/member-meeting-derived-state-contract.md): frontend selectors, cache expectations, and optimistic check-in responsibilities.
4. [quickstart.md](quickstart.md): implementation order and verification checklist.
5. Update `.github/copilot-instructions.md` so the agent context points to this plan.

## Complexity Tracking

No constitution violations or exceptions are required for this feature.
