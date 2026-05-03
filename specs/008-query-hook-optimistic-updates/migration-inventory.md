# Migration Inventory: Query Hook Optimistic Updates

## Migration Status

### Completed (US1 Read Query Wrapping)

1. `web/src/pages/group-edit.tsx`
   - Migrated to `useGroupFormQuery`.
2. `web/src/components/layout/RootLayout.tsx`
   - Migrated to `useMeQuery`.
3. `web/src/hooks/useMemberSearch.ts`
   - Migrated to `useMemberSearchQuery`.

### Remaining (Mutation Flows)

1. `web/src/components/group/GroupAdminActionsDropdown.tsx`
   - Direct `useMutation` calling `createUpcomingMeeting`.
2. `web/src/hooks/useGroupActions.ts`
   - Mutation wrapper with invalidate-only behavior; no optimistic rollback context.
3. `web/src/hooks/useGroupForm.ts`
   - Direct `useMutation` for save operations and direct API side effects for role/delete.
4. `web/src/hooks/useLogoutMenuAction.ts`
   - Direct `useMutation` calling `logout`.

## Notes

- Updated after US1 completion; will be updated again at completion audit (T032).
- Scope intentionally targets frontend server-state ownership patterns, not backend database model calls.

## Completion Audit (T032)

### Read Query Ownership

- `useQuery` / `useSuspenseQuery` call sites are now centralized in `web/src/queries/*`.
- No component/page/hook runtime read flows directly call `@/api/*` methods.

### Mutation Ownership

- Group-domain mutation flows migrated to `web/src/queries/*` wrappers:
  - `useCreateUpcomingMeetingMutation`
  - `useLeaveGroupMutation`
  - `useSaveGroupMutation`
  - `useGroupMemberMutations`
  - `useLogoutMutation`
- Remaining direct `useMutation` usage is outside this feature scope (auth form submissions).

### Cleanup Verification

- No TypeScript diagnostics were reported in migrated files after wrapper refactors.
- No additional dead code removal was required for targeted Phase 6 files.
