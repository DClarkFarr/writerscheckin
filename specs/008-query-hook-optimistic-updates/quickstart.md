# Quickstart: Query Hook Optimistic Updates

**Phase**: Phase 1 Design  
**Date**: 2026-05-02

## Objective

Replace direct query ownership in frontend components/hooks with query-hook wrappers, and apply optimistic mutation patterns with rollback and scoped cache handling.

## Prerequisites

- Branch: `008-feature-branch-hook`
- Spec: `specs/008-query-hook-optimistic-updates/spec.md`
- Plan: `specs/008-query-hook-optimistic-updates/plan.md`

## Implementation Flow

1. Audit all direct query/mutation call sites in `web/src`.
2. Create/extend wrappers in `web/src/queries/*` with `.key` factories.
3. Replace component/page direct `useQuery` usage with wrapper calls.
4. Move mutation cache logic to wrapper/hook layer with optimistic lifecycle.
5. Add targeted cache reconciliation per affected domain keys.
6. Validate rollback behavior and stale-response handling.

## Priority Migration Targets

1. `web/src/pages/group-edit.tsx`
2. `web/src/components/layout/RootLayout.tsx`
3. `web/src/hooks/useMemberSearch.ts`
4. `web/src/components/group/GroupAdminActionsDropdown.tsx`
5. `web/src/hooks/useGroupActions.ts`
6. `web/src/hooks/useGroupForm.ts`
7. `web/src/hooks/useLogoutMenuAction.ts`

## Wrapper Design Rules

- Read wrappers live in `web/src/queries/*`.
- Every wrapper exports `.key` and uses deterministic key tuples.
- Components/pages consume wrappers; they do not own query construction.
- Mutation wrappers implement optimistic cache update + rollback context by default.
- Use targeted `setQueryData` before broad `invalidateQueries` fallback.

## Validation Checklist

- [x] No direct component/page read queries against API methods remain in migrated scope.
- [x] Every new/updated wrapper exports `.key`.
- [x] Optimistic mutation applies immediate UI updates.
- [x] Failed mutation rolls back to exact prior cache state.
- [x] Success path reconciles with server response without visible flicker.
- [x] Cache updates touch only relevant key scopes.

## Manual Test Scenarios

1. Load group edit page and confirm data loads through wrapper-based query only.
2. Trigger group leave/remove/role update and verify immediate optimistic UI change.
3. Force server failure for a mutation and verify rollback and error messaging.
4. Trigger consecutive updates quickly and verify final cache state matches latest action.
5. Confirm auth state (`me`) still hydrates correctly via wrapper in root layout.

## Rollout Guidance

- Migrate by domain (groups first, then auth/supporting flows).
- Keep each domain in small, reviewable PR chunks.
- Validate cache-key usage with wrapper `.key` imports only.

## Governance Checkpoints

- [x] Query key ownership centralized in `web/src/queries/queryKeys.ts`.
- [x] Read wrappers established under `web/src/queries/*` with `.key` exports.
- [x] Initial mutation wrappers use optimistic snapshot/rollback patterns.
- [x] Remaining mutation flows fully migrated to wrapper-only usage across all targeted modules.

## Completion Notes

- Phases 1 through 5 are implemented.
- Phase 6 cleanup verification completed with no additional code removal required.
