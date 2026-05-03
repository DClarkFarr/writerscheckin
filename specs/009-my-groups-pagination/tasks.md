# Tasks: My Groups Pagination

**Input**: Design documents from `/specs/009-my-groups-pagination/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No dedicated automated test tasks are included because the specification does not require a TDD workflow or new automated test suites for this feature.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes a concrete file path target

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align shared contracts, types, and task-tracking artifacts before implementation begins.

- [x] T001 Update feature implementation checklist and validation steps in /Users/daniel/git/writerscheck.in/specs/009-my-groups-pagination/quickstart.md
- [x] T002 [P] Add paginated group read response types for summaries, members, and meetings in /Users/daniel/git/writerscheck.in/web/src/api/types/groups.ts
- [x] T003 [P] Extend pagination utilities for reusable 20-item cursor-based collection paging in /Users/daniel/git/writerscheck.in/express/src/utils/pagination.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish backend and frontend read primitives that every user story depends on.

**CRITICAL**: No user story work starts until this phase is complete.

- [x] T004 Create cursor-paginated group members model helper in /Users/daniel/git/writerscheck.in/express/src/models/groupMembers.ts
- [x] T005 [P] Refactor paginated group meetings model helper from offset semantics to cursor semantics in /Users/daniel/git/writerscheck.in/express/src/models/groupMeetings.ts
- [x] T006 Standardize group summary/detail response mappers without embedded members in /Users/daniel/git/writerscheck.in/express/src/services/groupSummaryMapper.ts
- [x] T007 Implement backend group detail, members, and meetings read service contracts in /Users/daniel/git/writerscheck.in/express/src/services/groupsService.ts
- [x] T008 Expose standardized paginated members and meetings routes in /Users/daniel/git/writerscheck.in/express/src/routers/groupsRouter.ts
- [x] T009 [P] Add frontend API client functions for paginated group members and meetings in /Users/daniel/git/writerscheck.in/web/src/api/groups.ts
- [x] T010 [P] Create shared infinite-query flattening and cursor helpers for group reads in /Users/daniel/git/writerscheck.in/web/src/queries/useMyGroupsQuery.ts

**Checkpoint**: Shared read contracts and pagination primitives are ready. User story implementation can begin.

---

## Phase 3: User Story 1 - Browse My Groups Incrementally (Priority: P1) 🎯 MVP

**Goal**: Users can browse My Groups through an infinite-scrolling feed that appends paginated summary rows only.

**Independent Test**: Open My Groups with more than 20 groups, scroll to fetch additional pages, and confirm rows append without any full member roster fields being loaded.

### Implementation for User Story 1

- [x] T011 [US1] Update the authenticated groups summary service to return counts-only summary rows for `/groups/mine` in /Users/daniel/git/writerscheck.in/express/src/services/groupsService.ts
- [x] T012 [US1] Ensure `/groups/mine` route parsing and response envelope match cursor-based infinite loading in /Users/daniel/git/writerscheck.in/express/src/routers/groupsRouter.ts
- [x] T013 [US1] Convert My Groups query wrapper from `useQuery` to infinite pagination in /Users/daniel/git/writerscheck.in/web/src/queries/useMyGroupsQuery.ts
- [x] T014 [US1] Refactor My Groups tab UI to trigger page fetches on scroll and preserve retry/empty states in /Users/daniel/git/writerscheck.in/web/src/components/home/MyGroupsTab.tsx
- [x] T015 [US1] Align My Groups API normalization with counts-only summary payloads in /Users/daniel/git/writerscheck.in/web/src/api/groups.ts

**Checkpoint**: User Story 1 is independently functional and delivers the MVP infinite-scrolling My Groups experience.

---

## Phase 4: User Story 2 - Load Members On Demand (Priority: P2)

**Goal**: Opening a group loads summary and members in parallel, and members append in 20-item batches via Load More.

**Independent Test**: Open a group view or edit screen and confirm members are not present in the summary payload, the first member batch loads immediately in parallel, and Load More appends the next 20 without resetting the existing list.

### Implementation for User Story 2

- [x] T016 [US2] Remove embedded member arrays from the managed group detail response in /Users/daniel/git/writerscheck.in/express/src/services/groupsService.ts
- [x] T017 [P] [US2] Finalize `GET /groups/:groupId/members` route authorization and cursor handling in /Users/daniel/git/writerscheck.in/express/src/routers/groupsRouter.ts
- [x] T018 [P] [US2] Add member page response normalization and request typing in /Users/daniel/git/writerscheck.in/web/src/api/groups.ts
- [x] T019 [US2] Create the paginated group members query wrapper with flattened rows and load-more state in /Users/daniel/git/writerscheck.in/web/src/queries/useGroupMembersQuery.ts
- [x] T020 [US2] Refactor summary modal to start summary and members queries in parallel and render member load-more states in /Users/daniel/git/writerscheck.in/web/src/components/group/GroupSummaryModal.tsx
- [x] T021 [US2] Refactor group view page to consume separate members query state and Load More behavior in /Users/daniel/git/writerscheck.in/web/src/pages/group-view.tsx
- [x] T022 [US2] Refactor group edit page to start detail summary and members queries in parallel before form initialization in /Users/daniel/git/writerscheck.in/web/src/pages/group-edit.tsx
- [x] T023 [US2] Update group members list rendering to support append-only member batches and section-scoped empty/error states in /Users/daniel/git/writerscheck.in/web/src/components/group/GroupMembersList.tsx
- [x] T024 [US2] Remove member-array assumptions from the group detail query wrappers in /Users/daniel/git/writerscheck.in/web/src/queries/useGroupQuery.ts
- [x] T025 [US2] Remove member-array assumptions from the editable group form query wrapper in /Users/daniel/git/writerscheck.in/web/src/queries/useGroupFormQuery.ts

**Checkpoint**: User Story 2 is independently functional with separate, paginated member loading in group detail contexts.

---

## Phase 5: User Story 3 - Review Group Meetings Chronologically (Priority: P3)

**Goal**: Group detail contexts show meetings below members, sorted newest to oldest, with append-only Load More Meetings behavior.

**Independent Test**: Open a group, verify the meetings section renders below members, confirm the first meetings batch is newest-first, and use Load More Meetings to append older rows without disturbing current content.

### Implementation for User Story 3

- [x] T026 [US3] Finalize cursor-based group meetings read service and response mapping in /Users/daniel/git/writerscheck.in/express/src/services/groupsService.ts
- [x] T027 [P] [US3] Complete `GET /groups/:groupId/meetings` route response handling in /Users/daniel/git/writerscheck.in/express/src/routers/groupsRouter.ts
- [x] T028 [P] [US3] Add group meetings page response normalization and request typing in /Users/daniel/git/writerscheck.in/web/src/api/groups.ts
- [x] T029 [US3] Create the paginated group meetings query wrapper with flattened newest-first rows in /Users/daniel/git/writerscheck.in/web/src/queries/useGroupMeetingsQuery.ts
- [x] T030 [US3] Add a reusable group meetings section with Load More Meetings, empty, and error states in /Users/daniel/git/writerscheck.in/web/src/components/group/GroupMeetingsSection.tsx
- [x] T031 [US3] Integrate meetings query and meetings section below members in /Users/daniel/git/writerscheck.in/web/src/components/group/GroupSummaryModal.tsx
- [x] T032 [US3] Integrate meetings query and meetings section below members in /Users/daniel/git/writerscheck.in/web/src/pages/group-view.tsx
- [x] T033 [US3] Integrate meetings query and meetings section below members in /Users/daniel/git/writerscheck.in/web/src/pages/group-edit.tsx

**Checkpoint**: User Story 3 is independently functional with chronological, paginated meetings below members.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation sync, and cleanup across all stories.

- [x] T034 [P] Update backend/frontend contract notes to match implemented payloads in /Users/daniel/git/writerscheck.in/specs/009-my-groups-pagination/contracts/groups-read-contract.md
- [x] T035 [P] Update query hook behavior notes to match implemented parallel-loading semantics in /Users/daniel/git/writerscheck.in/specs/009-my-groups-pagination/contracts/group-query-hooks-contract.md
- [x] T036 [P] Record final implementation notes and validation checklist results in /Users/daniel/git/writerscheck.in/specs/009-my-groups-pagination/quickstart.md
- [x] T037 Run backend validation commands documented for this feature from /Users/daniel/git/writerscheck.in/express/package.json
- [x] T038 Run frontend validation commands documented for this feature from /Users/daniel/git/writerscheck.in/web/package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; can begin immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers the MVP.
- **Phase 4 (US2)**: Depends on Phase 2 and benefits from the summary contract work completed in US1.
- **Phase 5 (US3)**: Depends on Phase 2 and should follow the same detail-loading pattern established in US2.
- **Phase 6 (Polish)**: Depends on completion of the desired user story phases.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational work; no dependency on later stories.
- **US2 (P2)**: Independent after foundational work, but assumes standardized summary/detail contracts exist.
- **US3 (P3)**: Independent after foundational work, but reuses the parallel detail-loading pattern from US2.

### Within Each User Story

- Backend contract shaping before frontend wrapper consumption.
- Query wrappers before UI integration.
- UI integration before final story validation.

## Parallel Opportunities

- Setup parallel tasks: T002, T003.
- Foundational parallel tasks: T005, T009, T010.
- US2 parallel backend/frontend setup: T017, T018.
- US3 parallel backend/frontend setup: T027, T028.
- Polish documentation updates: T034, T035, T036.

---

## Parallel Example: User Story 2

```bash
Task: T017 Finalize GET /groups/:groupId/members route handling in express/src/routers/groupsRouter.ts
Task: T018 Add member page response normalization in web/src/api/groups.ts
```

## Parallel Example: User Story 3

```bash
Task: T027 Complete GET /groups/:groupId/meetings route handling in express/src/routers/groupsRouter.ts
Task: T028 Add meetings page response normalization in web/src/api/groups.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate infinite scrolling My Groups and summary-only payload behavior.
4. Demo or ship the MVP slice.

### Incremental Delivery

1. Deliver US1 for paginated My Groups.
2. Deliver US2 for paginated members loaded on demand.
3. Deliver US3 for paginated meetings loaded below members.
4. Finish with documentation and validation.

### Parallel Team Strategy

1. One developer completes backend pagination primitives in Phase 2.
2. One developer builds frontend query wrappers while another prepares route/service updates for US2 and US3.
3. UI integration for My Groups, detail pages, and modal can be split by story once wrappers are ready.

---

## Notes

- `[P]` tasks target different files and can be worked in parallel.
- `[US1]`, `[US2]`, and `[US3]` map directly to the user stories in `spec.md`.
- Each story is scoped to remain independently testable once foundational work is complete.
