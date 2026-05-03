# Data Model: Query Hook Optimistic Updates

**Phase**: Phase 1 Design  
**Date**: 2026-05-02

## Overview

This feature introduces frontend data-contract entities for query wrapper consistency and optimistic cache correctness. No backend schema changes are required.

## Entities

### 1. QueryHookContract

Represents the standardized read hook shape used across `web/src/queries/*`.

**Attributes**:

- `keyFactory`: deterministic function that returns TanStack Query key tuples.
- `queryFn`: API transport invocation from `web/src/api/*`.
- `enabledRule`: optional predicate for conditional execution.
- `resultShape`: typed result values consumed by pages/components.

**Validation Rules**:

- Key factory output MUST be deterministic for identical inputs.
- Key factory MUST include all identity-defining parameters.
- Query function MUST not be invoked when `enabled` is false.

---

### 2. OptimisticMutationContext

Represents the snapshot and metadata used for optimistic mutation lifecycle.

**Attributes**:

- `affectedKeys`: query keys touched by optimistic update.
- `previousStateByKey`: pre-mutation cache values keyed by query key.
- `mutationInput`: normalized payload for reconciliation.
- `timestamp`: mutation start time for stale-response ordering checks.

**Validation Rules**:

- Context MUST be created before cache patching.
- Context MUST preserve enough data to rollback all touched keys.
- Context MUST be discarded after successful reconciliation.

---

### 3. CacheScope

Defines the smallest cache region allowed for optimistic write operations.

**Attributes**:

- `domain`: functional area (e.g., `my-groups`, `group-form`, `group-detail`, `auth-me`).
- `identity`: domain-specific key params (`groupId`, member identifier, etc.).
- `strategy`: patch-only, invalidate-only, or patch-then-invalidate.

**Validation Rules**:

- Optimistic updates MUST target only the minimum affected scope.
- Broader invalidation is fallback, not first choice.

## Relationships

- `QueryHookContract` owns `CacheScope` key definitions.
- `OptimisticMutationContext` references one or more `CacheScope` keys.
- Mutation wrappers use `QueryHookContract.keyFactory` to read/write scoped cache entries.

## State Transitions

### Mutation Lifecycle

1. `idle` -> `optimistic-applied`
2. `optimistic-applied` -> `committed` on success
3. `optimistic-applied` -> `rolled-back` on error
4. `committed` -> `reconciled` after targeted refetch/reconciliation

## Known Domain Scopes in Current Codebase

- `['me']` from root auth fetch.
- `['my-groups']` group listing.
- `['groups', groupId]` group detail.
- `['group-form', groupId]` group edit payload.
- `['members', 'search', query, groupId]` member search results.

## Integrity Rules

- No direct component-level API query ownership for read operations.
- No optimistic mutation without rollback context.
- Cache patch logic must be colocated with mutation wrappers that know the domain keys.
