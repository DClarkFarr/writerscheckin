# Tasks: My Groups Tab and Group Management Flows

**Input**: Design documents from `/specs/005-my-groups-tab/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No explicit TDD or automated test-authoring requirement was specified in the feature spec; tasks focus on implementation plus quickstart validation commands.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature scaffolding for frontend and backend group flows.

- [x] T001 Create shared group API/frontend type definitions in `web/src/api/types/groups.ts`
- [x] T002 [P] Create groups API client module scaffold in `web/src/api/groups.ts`
- [x] T003 [P] Create group routes directory scaffolding in `web/src/routes/groups/`
- [x] T004 Create backend groups router scaffold in `express/src/routers/groupsRouter.ts`
- [x] T005 Register groups router mount path in `express/src/routers/apiRouter.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared contracts and reusable primitives needed by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T006 Implement service-layer summary query contract for My Groups list in `express/src/services/groupsService.ts`
- [x] T007 [P] Implement cursor parsing/encoding helper utilities in `express/src/services/groupsPagination.ts`
- [x] T008 [P] Implement group summary mapper for counts and action eligibility in `express/src/services/groupSummaryMapper.ts`
- [x] T009 Add `GET /api/groups/mine` route handler shell wired to services in `express/src/routers/groupsRouter.ts`
- [x] T010 Implement shared UI shape normalization for group summary payloads in `web/src/api/groups.ts`
- [x] T011 Create reusable action dropdown component shell for group cards in `web/src/components/home/GroupAdminActionsMenu.tsx`

**Checkpoint**: Foundation complete; story implementation can proceed.

---

## Phase 3: User Story 1 - Browse My Groups (Priority: P1) 🎯 MVP

**Goal**: Show authenticated user's groups in My Groups tab with required summary fields and empty/loading/error states.

**Independent Test**: Sign in, open My Groups tab, and confirm only current user's groups appear with required card fields or empty state.

### Implementation for User Story 1

- [x] T012 [US1] Implement `listMyGroups` service using membership filtering in `express/src/services/groupsService.ts`
- [x] T013 [US1] Complete `GET /api/groups/mine` response wiring and error handling in `express/src/routers/groupsRouter.ts`
- [x] T014 [P] [US1] Create My Groups query hook for initial page load in `web/src/hooks/useMyGroupsQuery.ts`
- [x] T015 [P] [US1] Build My Groups tab list/card presentation component in `web/src/components/home/MyGroupsTab.tsx`
- [x] T016 [US1] Integrate My Groups tab content into authenticated home tabs in `web/src/pages/home.tsx`
- [x] T017 [US1] Render group card summary fields (name, recurrence, counts, next meeting date, edit button, actions trigger) in `web/src/components/home/MyGroupsTab.tsx`
- [x] T018 [US1] Implement loading/empty/recoverable error states for initial list load in `web/src/components/home/MyGroupsTab.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Load More Groups Seamlessly (Priority: P2)

**Goal**: Add infinite scrolling with cursor pagination and stable append behavior.

**Independent Test**: Seed multi-page data, scroll to bottom repeatedly, and verify pages append with no duplicates and proper terminal state.

### Implementation for User Story 2

- [ ] T019 [US2] Extend `listMyGroups` to return `nextCursor` and bounded limits in `express/src/services/groupsService.ts`
- [ ] T020 [US2] Validate cursor query params and pagination responses in `express/src/routers/groupsRouter.ts`
- [ ] T021 [P] [US2] Implement infinite query hook with cursor continuation in `web/src/hooks/useMyGroupsInfiniteQuery.ts`
- [ ] T022 [P] [US2] Add intersection-observer based load-more trigger in `web/src/components/home/MyGroupsTab.tsx`
- [ ] T023 [US2] Add duplicate-prevention merge logic for appended pages in `web/src/hooks/useMyGroupsInfiniteQuery.ts`
- [ ] T024 [US2] Add tail loading/error/retry/no-more-results UI states in `web/src/components/home/MyGroupsTab.tsx`

**Checkpoint**: User Stories 1 and 2 work with scalable list loading.

---

## Phase 5: User Story 3 - Create and Manage Group Actions (Priority: P3)

**Goal**: Add top create button and per-group actions for edit, activate/deactivate, and meeting action routing.

**Independent Test**: From My Groups, use create/edit and dropdown actions and verify destination/state changes.

### Implementation for User Story 3

- [ ] T025 [US3] Implement group state transition service operation in `express/src/services/groupsService.ts`
- [ ] T026 [US3] Add `PATCH /api/groups/:groupId` route in `express/src/routers/groupsRouter.ts`
- [ ] T027 [P] [US3] Add state transition API method in `web/src/api/groups.ts`
- [ ] T028 [US3] Add Create New Group CTA with navigation to `/groups/create` in `web/src/components/home/MyGroupsTab.tsx`
- [ ] T029 [US3] Wire Edit action navigation to `/groups/:groupId/edit` in `web/src/components/home/MyGroupsTab.tsx`
- [ ] T030 [US3] Implement actions dropdown rendering rules for activate/deactivate and meeting actions in `web/src/components/home/GroupAdminActionsMenu.tsx`
- [ ] T031 [US3] Implement optimistic state refresh after activate/deactivate in `web/src/hooks/useMyGroupsInfiniteQuery.ts`
- [ ] T032 [US3] Add view-upcoming-meeting navigation action handling in `web/src/components/home/GroupAdminActionsMenu.tsx`

**Checkpoint**: User Stories 1-3 are independently usable and action-complete for list-level operations.

---

## Phase 6: User Story 4 - Create/Edit Group Details and Meeting Routing (Priority: P4)

**Goal**: Deliver full create/edit group form, participant selectors, and create-upcoming-meeting redirect flow.

**Independent Test**: Open create/edit routes, save form data, and create upcoming meeting that redirects to meeting edit URL.

### Implementation for User Story 4

- [x] T033 [US4] Implement create group service contract for full form payload in `express/src/services/groupsService.ts`
- [x] T034 [US4] Implement edit group service contract with prefill response shape in `express/src/services/groupsService.ts`
- [x] T035 [US4] Add `POST /api/groups` and `PATCH /api/groups/:groupId` handlers in `express/src/routers/groupsRouter.ts`
- [x] T036 [US4] Implement participant search service operation in `express/src/services/groupsService.ts`
- [x] T037 [US4] Add `GET /api/groups/participants/search` handler in `express/src/routers/groupsRouter.ts`
- [x] T038 [US4] Implement upcoming-meeting-from-defaults service operation in `express/src/services/groupMeetingsService.ts`
- [x] T039 [US4] Add `POST /api/groups/:groupId/meetings/upcoming` route handler in `express/src/routers/groupsRouter.ts`
- [x] T040 [P] [US4] Implement create/edit group API methods and participant search client methods in `web/src/api/groups.ts`
- [x] T041 [P] [US4] Implement `useGroupForm` hook with create/edit mode and mutation flows in `web/src/hooks/useGroupForm.ts`
- [x] T042 [P] [US4] Implement reusable participant multi-select with avatar/name option rendering in `web/src/components/forms/GroupUserMultiSelect.tsx`
- [x] T043 [US4] Implement create/edit presentational form with rich text basic mode and selected-user list rendering in `web/src/components/forms/GroupForm.tsx`
- [x] T044 [US4] Create page component for `/groups/create` using `useGroupForm` create mode in `web/src/pages/group-create.tsx`
- [x] T045 [US4] Create page component for `/groups/:groupId/edit` with preloaded group props in `web/src/pages/group-edit.tsx`
- [x] T046 [US4] Create page component for `/groups/:groupId/meetings/:meetingId/edit` shell in `web/src/pages/group-meeting-edit.tsx`
- [x] T047 [US4] Add TanStack file route for `/groups/create` in `web/src/routes/groups/create.tsx`
- [x] T048 [US4] Add TanStack file route for `/groups/:groupId/edit` in `web/src/routes/groups/$groupId/edit.tsx`
- [x] T049 [US4] Add TanStack file route for `/groups/:groupId/meetings/:meetingId/edit` in `web/src/routes/groups/$groupId/meetings/$meetingId/edit.tsx`
- [x] T050 [US4] Wire create-manual-meeting action to create endpoint and redirect target in `web/src/components/home/GroupAdminActionsMenu.tsx`

**Checkpoint**: All user stories are functionally complete with canonical routes and form workflows.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate end-to-end quality, docs, and release readiness.

- [ ] T051 [P] Run frontend lint/build validation and resolve surfaced issues in `web/`
- [ ] T052 [P] Run backend build validation and resolve surfaced issues in `express/`
- [ ] T053 Run quickstart scenario validation and capture outcomes in `specs/005-my-groups-tab/quickstart.md`
- [ ] T054 Verify route guard behavior for invalid/unauthorized `groupId` and `meetingId` access in `web/src/routes/groups/$groupId/edit.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP.
- **Phase 4 (US2)**: Depends on US1 data path and Phase 2 foundation.
- **Phase 5 (US3)**: Depends on US1 UI scaffolding and Phase 2 foundation.
- **Phase 6 (US4)**: Depends on Phase 2 foundation; integrates with US3 actions.
- **Phase 7 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: Can start after foundational phase; no dependency on other user stories.
- **US2 (P2)**: Builds on US1 list query and rendering path.
- **US3 (P3)**: Builds on US1 card/dropdown rendering path.
- **US4 (P4)**: Can start after foundational phase for form/routes; meeting creation action integration depends on US3 dropdown action wiring.

### Within Each User Story

- Backend service logic before route handler completion.
- API client methods before hook integration.
- Hooks before page/component wiring.
- Routes after page components are ready.

## Parallel Opportunities

- Setup: T002 and T003 can run in parallel after T001.
- Foundational: T007, T008, and T011 can run in parallel after T006 starts.
- US1: T014 and T015 can run in parallel before T016/T017 integration.
- US2: T021 and T022 can run in parallel before T023/T024 finalization.
- US3: T027 and T030 can run in parallel while backend T025/T026 are in progress.
- US4: T040, T041, and T042 can run in parallel once backend contracts (T033-T039) are defined.
- Polish: T051 and T052 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T014 [P] [US1] Create My Groups initial query hook in web/src/hooks/useMyGroupsQuery.ts"
Task: "T015 [P] [US1] Build My Groups tab component scaffold in web/src/components/home/MyGroupsTab.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T021 [P] [US2] Implement infinite query hook in web/src/hooks/useMyGroupsInfiniteQuery.ts"
Task: "T022 [P] [US2] Add intersection observer trigger in web/src/components/home/MyGroupsTab.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T027 [P] [US3] Add group state API client method in web/src/api/groups.ts"
Task: "T030 [US3] Implement action availability rendering in web/src/components/home/GroupAdminActionsMenu.tsx"
```

## Parallel Example: User Story 4

```bash
Task: "T041 [P] [US4] Implement useGroupForm hook in web/src/hooks/useGroupForm.ts"
Task: "T042 [P] [US4] Implement GroupUserMultiSelect in web/src/components/forms/GroupUserMultiSelect.tsx"
Task: "T043 [US4] Implement GroupForm in web/src/components/forms/GroupForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1).
4. Validate US1 independently before continuing.

### Incremental Delivery

1. Deliver US1 (core My Groups visibility).
2. Deliver US2 (infinite loading).
3. Deliver US3 (actions + create/edit navigation).
4. Deliver US4 (full form + upcoming meeting creation and redirects).
5. Run Phase 7 polish validations.

### Parallel Team Strategy

1. Team A: Backend services/routes (`express/src/services/*`, `express/src/routers/groupsRouter.ts`).
2. Team B: My Groups UI + infinite query (`web/src/components/home/*`, `web/src/hooks/useMyGroups*`).
3. Team C: Group form + route pages (`web/src/components/forms/*`, `web/src/pages/*`, `web/src/routes/groups/*`).
4. Integrate, validate, and polish together.

---

## Notes

- All tasks follow the required checklist format with task IDs and explicit file paths.
- Story labels are included for all user-story phase tasks and omitted for setup/foundational/polish phases.
- Tasks are arranged to keep story increments independently verifiable.
