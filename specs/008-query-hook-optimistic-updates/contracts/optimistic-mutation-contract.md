# Contract: Optimistic Mutation and Cache Handling

## Purpose

Define required mutation lifecycle for server-state writes with optimistic UX and deterministic rollback.

## Applicability

Applies to all mutation wrappers handling create/update/delete/leave/role-change flows tied to cached query state.

## Contract Rules

1. Mutation wrappers MUST manage optimistic updates by default.
2. `onMutate` MUST:
   - cancel in-flight queries for affected keys,
   - snapshot pre-change values,
   - patch minimal affected cache scope.
3. `onError` MUST rollback using the snapshot from `onMutate`.
4. `onSuccess` MUST reconcile optimistic state with confirmed server payload.
5. `onSettled` SHOULD perform targeted invalidation only where reconciliation cannot guarantee correctness.
6. Components MUST trigger wrappers and MUST NOT perform direct cache writes for domain state.

## Lifecycle Shape

```ts
const mutation = useMutation({
  mutationFn: updateThing,
  onMutate: async (input) => {
    await queryClient.cancelQueries({ queryKey: useThingQuery.key(input.id) });
    const previous = queryClient.getQueryData(useThingQuery.key(input.id));

    queryClient.setQueryData(useThingQuery.key(input.id), (current) => {
      return patchThing(current, input);
    });

    return { previous };
  },
  onError: (_error, input, context) => {
    if (context?.previous !== undefined) {
      queryClient.setQueryData(useThingQuery.key(input.id), context.previous);
    }
  },
  onSuccess: (result, input) => {
    queryClient.setQueryData(useThingQuery.key(input.id), result);
  },
  onSettled: (_result, _error, input) => {
    void queryClient.invalidateQueries({
      queryKey: useThingQuery.key(input.id),
    });
  },
});
```

## Migration Acceptance

- Each migrated mutation has rollback-capable optimistic context.
- Cache updates are scoped to affected keys.
- Success reconciliation does not cause destructive flicker.

## Applied Migration Examples

- `web/src/queries/useCreateUpcomingMeetingMutation.ts`
  - Snapshots `my-groups`, applies scoped optimistic action update, then reconciles via targeted invalidation.
- `web/src/queries/useLeaveGroupMutation.ts`
  - Optimistically removes the group from `my-groups`, clears scoped group caches, and rolls back on failure.
- `web/src/queries/useSaveGroupMutation.ts`
  - Optimistically patches editable group values and group summary name in cache for edit mode, then reconciles.
- `web/src/queries/useGroupMemberMutations.ts`
  - Optimistically applies role and membership changes to group-form cache with rollback snapshots.
- `web/src/queries/useLogoutMutation.ts`
  - Optimistically clears `me` cache and restores from snapshot on error.
