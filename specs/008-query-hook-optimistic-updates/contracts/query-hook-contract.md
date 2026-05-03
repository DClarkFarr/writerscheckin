# Contract: Query Hook Wrapper Standard

## Purpose

Define the mandatory wrapper contract for frontend read queries so all server-state reads are normalized and key-driven.

## Applicability

Applies to all read query flows in `web/src` that consume API methods from `web/src/api/*`.

## Contract Rules

1. Each read wrapper MUST live under `web/src/queries/*`.
2. Each wrapper MUST expose `.key` as a deterministic key factory.
3. Each wrapper MUST call the corresponding API transport function in `queryFn`.
4. Wrapper MUST support `enabled` conditions where identity input can be absent.
5. Components/pages MUST consume wrappers, not define ad-hoc read `useQuery` against API functions.

## Canonical Shape

```ts
export type UseXQueryProps = {
  id: string | undefined;
};

export const xQueryKey = (id: string | undefined) => ["x", id];

export const useXQuery = (
  { id }: UseXQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  return useQuery({
    queryKey: xQueryKey(id),
    queryFn: () => getXById(id ?? ""),
    enabled: enabled !== false && !!id,
  });
};

useXQuery.key = xQueryKey;
```

## Migration Acceptance

- No direct read `useQuery` + API function combinations remain in migrated scope.
- Key factories are reused by cache invalidation/reconciliation logic.
- Wrapper naming is domain-explicit (`useMeQuery`, `useGroupFormQuery`, etc.).

## Applied Migration Examples

- `web/src/pages/group-edit.tsx` now reads via `useGroupFormQuery({ groupId })`.
- `web/src/components/layout/RootLayout.tsx` now reads via `useMeQuery()`.
- `web/src/hooks/useMemberSearch.ts` now reads via `useMemberSearchQuery(...)` after debounce.
