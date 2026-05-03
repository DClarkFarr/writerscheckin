# Implementation Plan: My Groups Pagination

**Branch**: `009-query-hook-updates` | **Date**: 2026-05-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-my-groups-pagination/spec.md`

## Summary

Standardize group read contracts so list and detail summary responses return group documents with counts but never embed member collections. Convert the My Groups frontend query wrapper from single-page `useQuery` to cursor-based infinite pagination, then introduce dedicated paginated members and meetings queries that start in parallel with group detail summary loading and append one 20-item batch at a time via explicit load-more controls.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: React 19, TanStack Query v5, TanStack Router, Axios API modules, Express 5, MongoDB native driver  
**Storage**: MongoDB on the backend; TanStack Query cache in browser memory on the frontend  
**Testing**: `cd web && npm run build`, `cd web && npm run lint`, `cd express && npm run build`, `cd express && npm run check:model-imports`, plus manual pagination/detail-flow verification  
**Target Platform**: Same-origin web SPA (`web/`) backed by Express API (`express/`)  
**Project Type**: Monorepo web application with frontend and backend changes  
**Performance Goals**: My Groups and group detail summary payloads exclude full member arrays; additional data loads in 20-item batches; detail pages begin summary, members, and meetings reads concurrently once `groupId` is known  
**Constraints**: Must follow Constitution Principles II, VIII, and XII; components must consume `@/queries/*` wrappers only; backend read contracts must remain typed and standardized; group detail pages must preserve already loaded batches during incremental fetches  
**Scale/Scope**: `/groups/mine`, `/groups/:groupId`, new/readjusted group members and meetings read endpoints, frontend API types, query wrappers, My Groups UI, group view, group edit, and summary modal

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                     |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | Plan preserves typed API contracts and query wrappers; no `any` or untyped response shaping required.     |
| II. Layered Backend Architecture              | PASS   | MongoDB work remains in models, orchestration in services, route translation in routers.                  |
| VIII. API Client & Data Fetching              | PASS   | Frontend transport stays in `web/src/api/groups.ts`; wrappers own caching and orchestration.              |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | My Groups, members, and meetings reads are owned by dedicated `@/queries/*` wrappers with `.key` methods. |

**Post-Design Re-Check**: PASS. Design artifacts keep transport in API modules, route/model responsibilities separated, and query-hook ownership explicit.

## Project Structure

### Documentation (this feature)

```text
specs/009-my-groups-pagination/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── group-query-hooks-contract.md
│   └── groups-read-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groupMembers.ts
    │   ├── groupMeetings.ts
    │   └── groups.ts
    ├── routers/
    │   └── groupsRouter.ts
    ├── services/
    │   ├── groupMeetingsService.ts
    │   ├── groupSummaryMapper.ts
    │   └── groupsService.ts
    └── utils/
        └── pagination.ts

web/
└── src/
    ├── api/
    │   ├── groups.ts
    │   └── types/groups.ts
    ├── components/
    │   ├── group/
    │   │   ├── GroupMembersList.tsx
    │   │   ├── GroupSummaryModal.tsx
    │   │   └── ...meeting list/detail section components
    │   └── home/
    │       └── MyGroupsTab.tsx
    ├── pages/
    │   ├── group-edit.tsx
    │   └── group-view.tsx
    └── queries/
        ├── useGroupFormQuery.ts
        ├── useGroupMeetingsQuery.ts
        ├── useGroupMembersQuery.ts
        ├── useGroupQuery.ts
        └── useMyGroupsQuery.ts
```

**Structure Decision**: Keep backend pagination and response shaping inside existing `express/src/models`, `services`, and `routers` boundaries, while concentrating all frontend data loading behavior in `web/src/api/groups.ts`, `web/src/api/types/groups.ts`, and dedicated query wrapper modules in `web/src/queries`.

## Phase 0: Research

Research resolves the following implementation decisions:

1. Standard response boundary between lightweight group summaries and separately paginated members/meetings collections.
2. Cursor strategy for infinite My Groups and load-more member/meeting feeds.
3. Parallel detail-page query startup while keeping summary, members, and meetings cache scopes independent.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): summary payloads, members/meetings batch envelopes, query state transitions.
2. [contracts/groups-read-contract.md](contracts/groups-read-contract.md): backend read response shapes and pagination semantics.
3. [contracts/group-query-hooks-contract.md](contracts/group-query-hooks-contract.md): frontend query wrapper responsibilities and parallel-loading behavior.
4. [quickstart.md](quickstart.md): implementation order and verification steps.
5. Update `.github/copilot-instructions.md` plan reference to this feature.

## Complexity Tracking

No constitution violations or justified exceptions are required for this feature.
