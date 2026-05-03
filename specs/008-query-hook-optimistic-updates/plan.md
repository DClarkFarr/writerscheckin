# Implementation Plan: Query Hook Optimistic Updates

**Branch**: `008-feature-branch-hook` | **Date**: 2026-05-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-query-hook-optimistic-updates/spec.md`

## Summary

Standardize frontend data access by replacing direct query/mutation usage in components and non-query wrappers with centralized query-hook wrappers, using `useGroupQuery.ts` as the canonical key-and-wrapper pattern. Extend the pattern to state changes with optimistic updates as the default: apply immediate cache updates, keep rollback context, and reconcile on success. Scope includes a full audit of `web/src` and targeted refactors in all direct API query points discovered during the scan.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)  
**Primary Dependencies**: React 19, TanStack Query v5, TanStack Router, Axios API modules in `web/src/api`  
**Storage**: Browser memory cache (TanStack Query cache); backend data source unchanged (Express + MongoDB)  
**Testing**: Existing frontend test/manual flows; add targeted manual verification for optimistic rollback and cache consistency  
**Target Platform**: Web SPA (`web/`) on desktop/mobile  
**Project Type**: Monorepo web application (frontend + backend, frontend-focused change)  
**Performance Goals**: Perceived mutation feedback <=150 ms; eliminate duplicate network fetches from duplicated direct queries  
**Constraints**: Must follow constitution Principle XII; must preserve existing API module contracts; no regressions in auth/group flows  
**Scale/Scope**: Whole-frontend audit for direct API query usage, with refactor coverage for all discovered direct query call sites and mutation cache flows tied to those domains

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                      | Status | Notes                                                                                                    |
| ---------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Strict TypeScript                              | PASS   | New hook wrappers and mutation contexts remain fully typed; no `any`.                                    |
| Frontend Query Hooks vs Direct API Calls (XII) | PASS   | Plan migrates direct `useQuery`/API reads into `web/src/queries/*` wrappers with `.key` factory methods. |
| API Client & Data Fetching (VIII)              | PASS   | API calls remain in `web/src/api/*`; wrappers orchestrate query/mutation behavior.                       |
| React Hook + Component Separation (VI)         | PASS   | Components consume wrappers/hooks; business logic remains in hooks/query modules.                        |
| Product Design/UX Imperatives (XI)             | PASS   | No visual redesign required; only data interaction behavior changes.                                     |

**Post-Design Re-Check**: PASS (no constitutional violations introduced by design artifacts)

## Project Structure

### Documentation (this feature)

```text
specs/008-query-hook-optimistic-updates/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── query-hook-contract.md
│   └── optimistic-mutation-contract.md
└── tasks.md                # created later by /speckit.tasks
```

### Source Code (repository root)

```text
web/
└── src/
    ├── api/
    │   ├── auth.ts
    │   └── groups.ts
    ├── components/
    │   ├── group/
    │   │   └── GroupAdminActionsDropdown.tsx      # direct mutation currently
    │   └── layout/
    │       └── RootLayout.tsx                     # direct query currently
    ├── hooks/
    │   ├── useGroupActions.ts                     # mutation + invalidation
    │   ├── useGroupForm.ts                        # mutation + direct member update/delete API calls
    │   ├── useLogoutMenuAction.ts                 # direct mutation currently
    │   └── useMemberSearch.ts                     # direct query currently
    ├── pages/
    │   └── group-edit.tsx                         # direct query currently
    └── queries/
        ├── useGroupQuery.ts                       # canonical wrapper example
        └── useMyGroupsQuery.ts                    # wrapper to align and extend
```

**Structure Decision**: Keep API transport in `web/src/api/*`, migrate all read query construction and key ownership into `web/src/queries/*`, and migrate optimistic mutation orchestration into dedicated hook/query wrappers used by components/pages.

## Migration Inventory (Codebase Scan)

Direct query/mutation patterns to refactor into wrappers and optimistic flows:

1. `web/src/pages/group-edit.tsx`: direct `useQuery` with `getGroupForm`.
2. `web/src/components/layout/RootLayout.tsx`: direct `useQuery` with `getMe`.
3. `web/src/hooks/useMemberSearch.ts`: direct `useQuery` with `searchMembers`.
4. `web/src/components/group/GroupAdminActionsDropdown.tsx`: direct `useMutation` with `createUpcomingMeeting`.
5. `web/src/hooks/useGroupActions.ts`: mutation wrapper exists but uses invalidation-only strategy; needs optimistic cache update + rollback context.
6. `web/src/hooks/useGroupForm.ts`: direct `useMutation` for create/update and direct role/delete API side-effects; needs wrapped mutation handlers with optimistic list updates and rollback.
7. `web/src/hooks/useLogoutMenuAction.ts`: direct mutation should be normalized to a shared wrapper contract.

## Phase 0: Research

Research focuses on three areas:

1. Canonical wrapper pattern for all reads (`.key`, `enabled`, error mapping, cache key ownership).
2. Optimistic mutation defaults (`onMutate`, context snapshot, `onError` rollback, `onSettled` reconciliation).
3. Cache scoping and invalidation minimization (prefer targeted `setQueryData` updates over broad invalidation).

**Output**: `research.md` with decisions, rationale, and alternatives.

## Phase 1: Design & Contracts

Design deliverables:

1. `data-model.md`: query key entities, optimistic mutation context, cache-scope boundaries.
2. `contracts/query-hook-contract.md`: read-hook wrapper contract and naming/keying conventions.
3. `contracts/optimistic-mutation-contract.md`: mutation lifecycle contract and rollback semantics.
4. `quickstart.md`: implementation runbook for discovery, migration order, validation.
5. Update Copilot context pointer to this feature plan in `.github/copilot-instructions.md`.

## Complexity Tracking

No constitution violations requiring exceptions.

## Implementation Governance Policy

- Read query ownership remains in `web/src/queries/*`; components and pages consume wrapper hooks only.
- Query keys are centralized via `web/src/queries/queryKeys.ts` and reused by mutation wrappers for cache operations.
- Mutation wrappers default to optimistic behavior with rollback snapshots and targeted reconciliation.
- Broad invalidation is used only as a fallback after scoped cache patches.
