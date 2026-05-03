# Research: Query Hook Optimistic Updates

**Phase**: Phase 0  
**Date**: 2026-05-02  
**Status**: Complete

## Research Findings

### 1. Read Query Wrapper Standardization

**Decision**: All frontend read requests are owned by `web/src/queries/*` wrappers with a `.key` factory, using `useGroupQuery.ts` as the baseline shape.

**Rationale**:

- Central key ownership reduces cache-key drift.
- Component code becomes declarative and focused on rendering.
- Error and `enabled` handling remains consistent across pages/features.

**Alternatives considered**:

- Keep ad-hoc `useQuery` in each page/hook (rejected: duplicated logic and inconsistent keys).
- Move API calls directly into components (rejected: violates constitution Principle XII).

---

### 2. Optimistic Updates as Mutation Default

**Decision**: For server-state mutations, use an optimistic lifecycle by default: `onMutate` snapshot + immediate cache patch, `onError` rollback, `onSettled` reconcile/invalidate.

**Rationale**:

- Improves perceived responsiveness.
- Prevents UX lag from waiting on round-trip network latency.
- Formal rollback context ensures correctness when failures occur.

**Alternatives considered**:

- Invalidate-only on success (rejected: delayed feedback, weaker UX).
- Fire-and-forget without rollback (rejected: risks stale/incorrect local state).

---

### 3. Cache Scope and Key Factories

**Decision**: Every wrapper exports a deterministic `.key` function and mutations update only affected keys before broad invalidation fallback.

**Rationale**:

- Allows precise `setQueryData` without touching unrelated cache entries.
- Makes shared invalidation/reconciliation reusable across hooks.
- Supports cross-feature consistency for future refactors.

**Alternatives considered**:

- String keys scattered in components (rejected: high maintenance risk).
- Global invalidate-all approach (rejected: excessive refetch and flicker).

---

### 4. Migration Discovery Strategy

**Decision**: Run full `web/src` discovery for direct API + `useQuery/useMutation` usage, then migrate by domain (auth, groups, member search, meeting actions).

**Rationale**:

- Ensures no direct query call sites remain in scope.
- Keeps reviewable, incremental migration batches.
- Reduces merge conflict pressure by limiting each batch area.

**Alternatives considered**:

- Big-bang rewrite in one commit (rejected: hard to validate and risky).
- Only migrate newly touched files (rejected: misses the user requirement for codebase-wide replacement in scope).

---

### 5. Mutation Contract Placement

**Decision**: Keep network transport in `web/src/api/*`; place mutation wrappers and optimistic logic in hooks/queries layer consumed by components.

**Rationale**:

- Preserves existing API clients and typed response contracts.
- Keeps business-level cache logic near query-key definitions.
- Aligns with current architecture and constitution requirements.

**Alternatives considered**:

- Embed optimistic logic in API modules (rejected: API layer should be transport-only).
- Put optimistic logic directly in components (rejected: violates separation concerns).

## Resolved Clarifications

- Clarification A: What does "replace direct db queries" map to in this frontend context?  
  Resolution: Treat as direct server-state query/mutation usage in components/non-query wrappers, and migrate to hook/query wrapper contracts.

- Clarification B: Should optimistic updates be optional?  
  Resolution: No. Optimistic behavior is the default for server-state mutations, with explicit rollback and reconciliation.

- Clarification C: How to prevent key drift across modules?  
  Resolution: `.key` factory ownership per wrapper and reuse in mutations/invalidation.
