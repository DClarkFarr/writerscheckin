# Tasks: Group Invite Actions

**Input**: Design documents from /specs/014-group-invite-actions/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No explicit test-first requirement was specified in the feature specification, so test tasks are not listed as separate checklist items.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared API and query scaffolding for invite reads and actions.

- [x] T001 Add invite action request and response contracts in web/src/api/types/groups.ts
- [x] T002 Add respond-to-invite API client function in web/src/api/groups.ts
- [x] T003 Create invite view-model hook scaffold in web/src/hooks/useGroupInvites.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend and cache orchestration required before user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add membership lookup helper for invite response authorization in express/src/models/groupMembers.ts
- [x] T005 Implement invite response service with invited-to-accepted/declined transitions in express/src/services/groupMembersService.ts
- [x] T006 Add user invite response route POST /groups/members/:membershipId/respond in express/src/routers/groupsRouter.ts
- [x] T007 Add invite response result mapping and error normalization in web/src/api/groups.ts
- [x] T008 Create invite response mutation hook scaffold in web/src/queries/useRespondToGroupInviteMutation.ts
- [x] T009 Implement optimistic snapshot and rollback for invited query cache in web/src/queries/useRespondToGroupInviteMutation.ts
- [x] T010 Implement settle-time invalidation for invited groups, accepted groups, and meetings queries in web/src/queries/useRespondToGroupInviteMutation.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - See Pending Invite Count (Priority: P1) 🎯 MVP

**Goal**: Show an accurate pending invite count badge on the My Groups tab when the home page loads.

**Independent Test**: Load home page as users with zero and non-zero pending invites and confirm badge visibility and count.

### Implementation for User Story 1

- [x] T011 [US1] Add invited-groups query consumption for badge count in web/src/pages/home.tsx
- [x] T012 [US1] Render pending invite badge on My Groups tab trigger with hide-on-zero behavior in web/src/pages/home.tsx
- [x] T013 [US1] Map invited groups data to a stable pending count in web/src/hooks/useGroupInvites.ts
- [x] T014 [US1] Handle badge loading and fallback states without breaking tab switching in web/src/pages/home.tsx

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Review Invite Details (Priority: P1)

**Goal**: Show a Group Invites card with sorted pending invite rows and required details/actions.

**Independent Test**: Open My Groups tab with multiple invites and verify heading, fields, controls, and created-date sort order.

### Implementation for User Story 2

- [x] T015 [P] [US2] Create invite row component with detail slots and action props in web/src/components/home/GroupInviteListItem.tsx
- [x] T016 [P] [US2] Create invite list/card component with Group Invites heading in web/src/components/home/GroupInviteList.tsx
- [x] T017 [US2] Integrate Group Invites card into My Groups tab above accepted groups list in web/src/components/home/MyGroupsTab.tsx
- [x] T018 [US2] Map group name, address, and meeting time fields for invite rows in web/src/hooks/useGroupInvites.ts
- [x] T019 [US2] Apply created-date descending sort for pending invites before render in web/src/hooks/useGroupInvites.ts
- [x] T020 [US2] Render Join Group and Decline buttons with required icons and color styling in web/src/components/home/GroupInviteListItem.tsx

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Accept Or Decline Invite (Priority: P1)

**Goal**: Allow users to accept/decline each invite with optimistic updates and correct post-action behavior.

**Independent Test**: Accept one invite and decline one invite; verify redirect behavior, list/badge updates, and cross-tab cache refresh.

### Implementation for User Story 3

- [x] T021 [US3] Wire invite list action callbacks to mutation hook in web/src/components/home/MyGroupsTab.tsx
- [x] T022 [US3] Implement accept action redirect to group view route after successful mutation in web/src/hooks/useGroupInvites.ts
- [x] T023 [US3] Implement optimistic invite removal and rollback handling in web/src/queries/useRespondToGroupInviteMutation.ts
- [x] T024 [US3] Implement accepted-groups cache update path for successful accept actions in web/src/queries/useRespondToGroupInviteMutation.ts
- [x] T025 [US3] Trigger meetings query refresh after invite actions settle in web/src/queries/useRespondToGroupInviteMutation.ts
- [x] T026 [US3] Add action error feedback for failed invite responses in web/src/components/home/GroupInviteList.tsx

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks and validation.

- [x] T027 [P] Align quickstart verification notes with implemented query keys and routes in specs/014-group-invite-actions/quickstart.md
- [x] T028 [P] Align invite action contract examples with final response payload fields in specs/014-group-invite-actions/contracts/group-invite-actions-contract.md
- [ ] T029 Run full feature verification checklist for badge, list, actions, and cache refresh in specs/014-group-invite-actions/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on other stories.
- **US2 (P1)**: Starts after Foundational; depends on US1 badge data hook only for shared invite data mapping.
- **US3 (P1)**: Starts after Foundational and US2 component wiring, then completes action behaviors and refresh logic.

### Within Each User Story

- Data mapping before rendering.
- Mutation wiring before navigation side effects.
- Optimistic update logic before final error handling polish.

## Parallel Opportunities

- **Setup**: T001 and T003 can run in parallel after task kickoff.
- **Foundational**: T004 and T008 can run in parallel, then merge through T009 and T010.
- **US2**: T015 and T016 can run in parallel before integration task T017.
- **Polish**: T027 and T028 can run in parallel.

## Parallel Example: User Story 2

- Run T015 and T016 concurrently to build item/list presentation pieces.
- Then complete T017, T018, T019, and T020 to wire and finalize behavior.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete Phase 3 (US1).
4. Validate home badge behavior with pending and zero-invite users.

### Incremental Delivery

1. Deliver US1 badge visibility.
2. Deliver US2 invite list details and controls.
3. Deliver US3 accept/decline behavior, redirects, and query refresh.
4. Finish with cross-cutting verification in Phase 6.

### Parallel Team Strategy

1. Backend developer: T004-T007.
2. Query/cache developer: T008-T010 and T023-T025.
3. UI developer: T011-T022 and T026.
4. Final pass: T027-T029.

## Notes

- [P] tasks = different files and no blocking dependency on incomplete tasks.
- [USx] labels map each implementation task to a user story.
- Keep query key ownership in query hooks and avoid direct component API calls.
- Commit in logical batches after each checkpoint.
