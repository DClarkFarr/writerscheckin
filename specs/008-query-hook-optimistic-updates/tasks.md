# Tasks: Query Hook Optimistic Updates

**Input**: Design documents from `/specs/008-query-hook-optimistic-updates/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No dedicated automated test tasks are included because the specification does not require TDD or new automated test suites for this feature.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes concrete file path targets

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare migration inventory and shared refactor scaffolding.

- [x] T001 Create migration inventory of direct query/mutation call sites in specs/008-query-hook-optimistic-updates/migration-inventory.md
- [x] T002 [P] Create shared query key helpers in web/src/queries/queryKeys.ts
- [x] T003 [P] Create optimistic cache utility helpers and rollback context types in web/src/queries/optimisticCache.ts
- [x] T004 Update query-related shared option types for wrapper consistency in web/src/types/query.types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish standardized wrapper modules that all user stories depend on.

**CRITICAL**: No user story work starts until this phase is complete.

- [x] T005 Normalize canonical wrapper key export pattern in web/src/queries/useGroupQuery.ts
- [x] T006 Normalize my-groups wrapper key export and options handling in web/src/queries/useMyGroupsQuery.ts
- [x] T007 [P] Create auth identity read wrapper in web/src/queries/useMeQuery.ts
- [x] T008 [P] Create group edit payload read wrapper in web/src/queries/useGroupFormQuery.ts
- [x] T009 [P] Create member search read wrapper in web/src/queries/useMemberSearchQuery.ts
- [x] T010 Export all read wrappers from web/src/queries/index.ts

**Checkpoint**: Wrapper foundation complete. User stories can now proceed.

---

## Phase 3: User Story 1 - Standardized Query Wrapping (Priority: P1) 🎯 MVP

**Goal**: Replace direct read query ownership with query-hook wrappers across the migrated scope.

**Independent Test**: Load migrated pages/flows and confirm they consume query wrappers only, with no direct read `useQuery` + API usage in migrated files.

### Implementation for User Story 1

- [x] T011 [P] [US1] Refactor group edit page to use useGroupFormQuery in web/src/pages/group-edit.tsx
- [x] T012 [P] [US1] Refactor root auth hydration to use useMeQuery in web/src/components/layout/RootLayout.tsx
- [x] T013 [P] [US1] Refactor debounced member search hook to consume useMemberSearchQuery in web/src/hooks/useMemberSearch.ts
- [x] T014 [US1] Remove direct read-query ownership from any remaining migrated files and update inventory results in specs/008-query-hook-optimistic-updates/migration-inventory.md
- [x] T015 [US1] Update usage examples to wrapper-first patterns in specs/008-query-hook-optimistic-updates/contracts/query-hook-contract.md

**Checkpoint**: User Story 1 is independently functional with wrapper-based read flows.

---

## Phase 4: User Story 2 - Optimistic Mutation Experience (Priority: P2)

**Goal**: Implement optimistic update defaults with rollback and scoped cache reconciliation for migrated mutation flows.

**Independent Test**: Trigger migrated mutations and confirm immediate UI updates, rollback on failure, and reconciled cache state on success.

### Implementation for User Story 2

- [x] T016 [P] [US2] Create create-upcoming-meeting mutation wrapper with optimistic cache handling in web/src/queries/useCreateUpcomingMeetingMutation.ts
- [x] T017 [P] [US2] Create leave-group mutation wrapper with rollback context in web/src/queries/useLeaveGroupMutation.ts
- [x] T018 [P] [US2] Create save-group mutation wrapper with optimistic my-groups and group-form cache patching in web/src/queries/useSaveGroupMutation.ts
- [x] T019 [P] [US2] Create group member role/delete mutation wrappers with rollback in web/src/queries/useGroupMemberMutations.ts
- [x] T020 [P] [US2] Create logout mutation wrapper with auth cache reconciliation in web/src/queries/useLogoutMutation.ts
- [x] T021 [US2] Refactor admin actions dropdown to consume useCreateUpcomingMeetingMutation in web/src/components/group/GroupAdminActionsDropdown.tsx
- [x] T022 [US2] Refactor group leave actions to consume useLeaveGroupMutation in web/src/hooks/useGroupActions.ts
- [x] T023 [US2] Refactor group form save flow to consume useSaveGroupMutation in web/src/hooks/useGroupForm.ts
- [x] T024 [US2] Refactor group member role/delete side effects to consume useGroupMemberMutations in web/src/hooks/useGroupForm.ts
- [x] T025 [US2] Refactor logout menu action to consume useLogoutMutation in web/src/hooks/useLogoutMenuAction.ts
- [x] T026 [US2] Replace invalidate-only behavior with scoped patch-then-reconcile logic across migrated mutation wrappers in web/src/queries/useCreateUpcomingMeetingMutation.ts
- [x] T027 [US2] Align rollback and stale-response handling guidance with implemented wrappers in specs/008-query-hook-optimistic-updates/contracts/optimistic-mutation-contract.md

**Checkpoint**: User Story 2 is independently functional with optimistic mutation behavior.

---

## Phase 5: User Story 3 - Governance for Query Hook Patterns (Priority: P3)

**Goal**: Codify and propagate governance for wrapper and optimistic update standards.

**Independent Test**: Review governance docs and confirm explicit guidance for wrapper ownership, optimistic defaults, rollback, and cache scope.

### Implementation for User Story 3

- [x] T028 [US3] Update governance wording for optimistic defaults and rollback requirements in .specify/memory/constitution.md
- [x] T029 [US3] Synchronize feature plan governance references and migration policy in specs/008-query-hook-optimistic-updates/plan.md
- [x] T030 [US3] Add contributor implementation guidance for query wrappers and optimistic mutations in web/README.md
- [x] T031 [US3] Update quickstart governance checkpoints in specs/008-query-hook-optimistic-updates/quickstart.md

**Checkpoint**: User Story 3 documentation and governance updates are independently complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and delivery readiness.

- [x] T032 [P] Run completion audit and record remaining direct API query/mutation ownership in specs/008-query-hook-optimistic-updates/migration-inventory.md
- [x] T033 [P] Remove unused imports and dead code introduced by wrapper migrations in web/src/pages/group-edit.tsx
- [x] T034 [P] Remove unused imports and dead code introduced by wrapper migrations in web/src/components/layout/RootLayout.tsx
- [x] T035 [P] Remove unused imports and dead code introduced by wrapper migrations in web/src/hooks/useMemberSearch.ts
- [x] T036 [P] Remove unused imports and dead code introduced by wrapper migrations in web/src/components/group/GroupAdminActionsDropdown.tsx
- [x] T037 [P] Remove unused imports and dead code introduced by wrapper migrations in web/src/hooks/useGroupActions.ts
- [x] T038 [P] Remove unused imports and dead code introduced by wrapper migrations in web/src/hooks/useGroupForm.ts
- [x] T039 [P] Remove unused imports and dead code introduced by wrapper migrations in web/src/hooks/useLogoutMenuAction.ts
- [x] T040 Update completion checklist and validation notes in specs/008-query-hook-optimistic-updates/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2 and should follow US1 for cleaner cache-key reuse.
- **Phase 5 (US3)**: Depends on Phase 3 and Phase 4 outcomes.
- **Phase 6 (Polish)**: Depends on completion of all user story phases.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational work; MVP slice.
- **US2 (P2)**: Independent after foundational work, but benefits from US1 wrappers being in place.
- **US3 (P3)**: Depends on the implemented behavior from US1 and US2 to document final rules accurately.

### Within Each User Story

- Create wrappers before consumer refactors.
- Consumer refactors before documentation synchronization.
- Complete story validation before progressing to next priority.

## Parallel Opportunities

- Setup parallel tasks: T002, T003.
- Foundational parallel tasks: T007, T008, T009.
- US1 parallel tasks: T011, T012, T013.
- US2 parallel wrapper creation: T016, T017, T018, T019, T020.
- Polish cleanup tasks: T033 through T039.

---

## Parallel Example: User Story 1

```bash
Task: T011 Refactor web/src/pages/group-edit.tsx to use useGroupFormQuery
Task: T012 Refactor web/src/components/layout/RootLayout.tsx to use useMeQuery
Task: T013 Refactor web/src/hooks/useMemberSearch.ts to consume useMemberSearchQuery
```

## Parallel Example: User Story 2

```bash
Task: T016 Create web/src/queries/useCreateUpcomingMeetingMutation.ts
Task: T017 Create web/src/queries/useLeaveGroupMutation.ts
Task: T018 Create web/src/queries/useSaveGroupMutation.ts
Task: T019 Create web/src/queries/useGroupMemberMutations.ts
Task: T020 Create web/src/queries/useLogoutMutation.ts
```

## Parallel Example: Polish

```bash
Task: T033 Cleanup web/src/pages/group-edit.tsx
Task: T036 Cleanup web/src/components/group/GroupAdminActionsDropdown.tsx
Task: T038 Cleanup web/src/hooks/useGroupForm.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate wrapper-only read query ownership for migrated files.
4. Demo/deploy MVP slice if stable.

### Incremental Delivery

1. Deliver US1 wrapper migration.
2. Deliver US2 optimistic mutation behavior.
3. Deliver US3 governance and documentation sync.
4. Run cross-cutting polish and completion audit.

### Parallel Team Strategy

1. One developer builds foundational wrappers (Phase 2).
2. One developer migrates US1 consumers while another builds US2 mutation wrappers.
3. One developer finalizes governance docs once behavior stabilizes.
