# Implementation Plan: Group Invite Actions

**Branch**: `[014-group-invite-actions]` | **Date**: 2026-05-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-group-invite-actions/spec.md`

## Summary

Implement pending group invite UX on the home page by reusing `GET /groups/mine` with `status=invited` for badge + invite list data, adding user-facing invite actions (accept/decline), and wiring optimistic cache updates plus targeted query invalidation so both My Meetings and My Groups stay in sync after invite actions.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query v5, TanStack Router, Axios API modules, ShadCN UI, unplugin-icons, dayjs  
**Storage**: MongoDB (`groupMembers`, `groups`, `groupMeetings`, `meetingAttendees`) and TanStack Query in-memory cache  
**Testing**: `cd express && npm run build`, `cd web && npm run lint`, `cd web && npx tsc --noEmit`, plus manual home-tab invite flow verification  
**Target Platform**: Same-origin Express API + React SPA in monorepo deployment  
**Project Type**: Monorepo web application (backend + frontend)  
**Performance Goals**: Preserve paginated list behavior and avoid extra endpoint fan-out by sourcing invite lists from existing `groups/mine` query path  
**Constraints**: Must reuse `groups/mine` with status filter for invite reads; optimistic UI must rollback safely; query-key ownership remains in query hooks; no direct API calls from presentational components  
**Scale/Scope**: Home tabs (`My Groups`, `My Meetings`), invite list UI components, invite action mutation hooks, router/service endpoint for member self-response

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                    |
| --------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | Invite list item types and mutation response contracts are propagated through shared API types.          |
| II. Layered Backend Architecture              | PASS   | Invite response logic will be implemented in service/model layers, with router as transport only.        |
| VI. Frontend Hook + Component Separation      | PASS   | New invite list and invite list item remain presentational; state/mutations stay in hooks/query modules. |
| VIII. API Client & Data Fetching              | PASS   | Frontend reads/mutations go through `web/src/api/groups.ts` and TanStack Query hooks.                    |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | Query keys and cache policy are defined via hook-owned key helpers with `mutateAsync`-first workflow.    |
| X. Date Formatting & Time Utilities           | PASS   | Invite time/date display continues through centralized formatting helpers.                               |

**Post-Design Re-Check**: PASS. Design artifacts maintain layering, query-key ownership, and centralized API/query usage.

## Project Structure

### Documentation (this feature)

```text
specs/014-group-invite-actions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── group-invites-read-contract.md
│   └── group-invite-actions-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── routers/
    │   └── groupsRouter.ts
    ├── services/
    │   └── groupMembersService.ts
    └── models/
        └── groupMembers.ts

web/
└── src/
    ├── api/
    │   ├── groups.ts
    │   └── types/groups.ts
    ├── components/
    │   └── home/
    │       ├── GroupInviteList.tsx
    │       └── GroupInviteListItem.tsx
    ├── pages/
    │   └── home.tsx
    ├── hooks/
    │   └── useGroupInvites.ts
    └── queries/
        ├── useMyGroupsQuery.ts
        ├── useRespondToGroupInviteMutation.ts
        └── optimisticCache.ts
```

**Structure Decision**: Implement invite reads and writes within existing groups domain modules, add focused home invite components, and centralize cache orchestration inside query hooks/mutation hooks so meetings and groups tabs update coherently.

## Phase 0: Research

Research decisions addressed:

1. Reuse `GET /groups/mine?status=invited` for invite badge + invite list to avoid introducing a dedicated invites read endpoint.
2. Add a focused invite response API contract for users to accept/decline their own pending invite, backed by existing status transition rules in `groupMembers` model logic.
3. Use optimistic mutation handling with snapshot + rollback and invalidate both `myGroupQueryKey("invited")`, `myGroupQueryKey("accepted")`, and `myMeetingsQueryKey()` on settle.
4. Compose UI from new `GroupInviteList` and `GroupInviteListItem` components while keeping navigation and mutation orchestration in hooks.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): invite read/write entities, state transitions, and frontend view model definitions.
2. [contracts/group-invites-read-contract.md](contracts/group-invites-read-contract.md): read contract via reused `groups/mine` endpoint with `status=invited` and ordering requirements.
3. [contracts/group-invite-actions-contract.md](contracts/group-invite-actions-contract.md): accept/decline mutation contract, authorization rules, and response shape.
4. [quickstart.md](quickstart.md): implementation order and verification checklist, including cache coherence checks for meetings and groups tabs.
5. Update `.github/copilot-instructions.md` SPECKIT context pointer to this plan.

## Complexity Tracking

No constitution violations or exceptions required for this feature.
