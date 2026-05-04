# Tasks: My Meetings Tab

**Input**: Design documents from `/specs/010-my-meetings-tab/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No dedicated automated test tasks are included because the specification does not require a TDD workflow or new automated test suites for this feature.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`, `[US4]`)
- Every task includes a concrete file path target

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared type and API scaffolding for My Meetings contracts.

- [x] T001 Add standardized My Meetings feed and check-in interfaces in /Users/daniel/git/writerscheck.in/web/src/api/types/groups.ts
- [x] T002 [P] Add `getMyMeetings` and `updateMeetingCheckin` API client functions in /Users/daniel/git/writerscheck.in/web/src/api/groups.ts
- [x] T003 [P] Add reusable cursor helpers for segment-aware feed paging in /Users/daniel/git/writerscheck.in/express/src/utils/pagination.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement backend and query-layer primitives required by all user stories.

**CRITICAL**: No user story work starts until this phase is complete.

- [x] T004 Implement meeting feed read helpers for role-aware visibility and deterministic sorting in /Users/daniel/git/writerscheck.in/express/src/models/groupMeetings.ts
- [x] T005 [P] Implement meeting check-in persistence and aggregate count helpers in /Users/daniel/git/writerscheck.in/express/src/models/meetingCheckins.ts
- [x] T006 Create standardized `MyMeetingFeedItem` mapper shared by upcoming, draft, and past rows in /Users/daniel/git/writerscheck.in/express/src/services/groupMeetingsService.ts
- [x] T007 Implement `listMyMeetings` orchestration with upcoming-first segment composition in /Users/daniel/git/writerscheck.in/express/src/services/groupsService.ts
- [x] T008 Implement `updateMeetingCheckin` service with idempotent state transitions in /Users/daniel/git/writerscheck.in/express/src/services/meetingCheckinService.ts
- [x] T009 Expose `/groups/meetings/mine` and `/groups/meetings/:meetingId/checkin` routes in /Users/daniel/git/writerscheck.in/express/src/routers/groupsRouter.ts
- [x] T010 Create `useMyMeetingsQuery` base key helper and infinite-query shell in /Users/daniel/git/writerscheck.in/web/src/queries/useMyMeetingsQuery.ts

**Checkpoint**: Shared backend contracts and frontend query scaffolding are ready. User story implementation can begin.

---

## Phase 3: User Story 1 - View Upcoming And Past Meetings (Priority: P1) 🎯 MVP

**Goal**: Users see upcoming meetings first (next per group), then past meetings, with correct role-based visibility.

**Independent Test**: Open My Meetings as member and admin users; confirm ordering, next-upcoming-per-group behavior, and draft visibility rules are correct.

### Implementation for User Story 1

- [x] T011 [US1] Enforce member rule for next published upcoming meeting per group in /Users/daniel/git/writerscheck.in/express/src/services/groupsService.ts
- [x] T012 [US1] Enforce admin/owner rule to include upcoming drafts with admin-only flags in /Users/daniel/git/writerscheck.in/express/src/services/groupsService.ts
- [x] T013 [P] [US1] Finalize segment sort/tie-break cursor behavior in /Users/daniel/git/writerscheck.in/express/src/models/groupMeetings.ts
- [x] T014 [US1] Finalize `/groups/meetings/mine` request parsing and response envelope in /Users/daniel/git/writerscheck.in/express/src/routers/groupsRouter.ts
- [x] T015 [US1] Add feed response normalization for segment ordering in /Users/daniel/git/writerscheck.in/web/src/api/groups.ts
- [x] T016 [US1] Implement `useMyMeetingsQuery` infinite flattening and de-duplication logic in /Users/daniel/git/writerscheck.in/web/src/queries/useMyMeetingsQuery.ts
- [x] T017 [US1] Build initial My Meetings tab data rendering with empty/error states in /Users/daniel/git/writerscheck.in/web/src/components/home/MyMeetingsTab.tsx

**Checkpoint**: User Story 1 is independently functional and can serve as the MVP.

---

## Phase 4: User Story 2 - Update Personal Check-In Status (Priority: P2)

**Goal**: Users can set attending, reading, or not attending via drawer flow with optimistic updates.

**Independent Test**: Click `check in` on an upcoming meeting, choose each status option, and verify optimistic UI updates and rollback behavior on simulated failure.

### Implementation for User Story 2

- [x] T018 [US2] Implement POST check-in route validation and authorization in /Users/daniel/git/writerscheck.in/express/src/routers/groupsRouter.ts
- [x] T019 [US2] Implement meeting check-in state transition and eligibility checks in /Users/daniel/git/writerscheck.in/express/src/services/meetingCheckinService.ts
- [x] T020 [P] [US2] Persist check-in changes and return canonical counts/state in /Users/daniel/git/writerscheck.in/express/src/models/meetingCheckins.ts
- [x] T021 [US2] Add check-in mutation request/response typing and API wiring in /Users/daniel/git/writerscheck.in/web/src/api/groups.ts
- [x] T022 [US2] Implement `useMeetingCheckinMutation` optimistic patch, rollback, and reconcile flow in /Users/daniel/git/writerscheck.in/web/src/queries/useMeetingCheckinMutation.ts
- [x] T023 [P] [US2] Implement drawer state controller hook in /Users/daniel/git/writerscheck.in/web/src/hooks/useMeetingCheckinDrawer.ts
- [x] T024 [US2] Build check-in drawer options (`attending`, `reading`, `not attending`) in /Users/daniel/git/writerscheck.in/web/src/components/home/MeetingCheckinDrawer.tsx
- [x] T025 [US2] Wire My Meetings row button actions to open drawer and submit mutations in /Users/daniel/git/writerscheck.in/web/src/components/home/MyMeetingsTab.tsx

**Checkpoint**: User Story 2 is independently functional with optimistic check-in mutation behavior.

---

## Phase 5: User Story 3 - Understand Meeting State At A Glance (Priority: P3)

**Goal**: Meeting rows clearly express status through date bookend, colors, counts, badges, and admin-only draft indicators.

**Independent Test**: Render upcoming, absent, past, and admin-draft rows and verify color mapping, date layout, badges, and button tone rules.

### Implementation for User Story 3

- [x] T026 [US3] Create `MeetingFeedItem` presentational component with left date bookend layout in /Users/daniel/git/writerscheck.in/web/src/components/home/MeetingFeedItem.tsx
- [x] T027 [P] [US3] Add date formatting helpers for `D`, `MMM Do`, and `YYYY` display lines in /Users/daniel/git/writerscheck.in/web/src/lib/dateFormat.ts
- [x] T028 [US3] Implement border/bookend/button tone mapping (`blue`, `red`, `gray`) in /Users/daniel/git/writerscheck.in/web/src/components/home/MeetingFeedItem.tsx
- [x] T029 [US3] Render attendance and reading counts with required badge labels in /Users/daniel/git/writerscheck.in/web/src/components/home/MeetingFeedItem.tsx
- [x] T030 [US3] Render `admin only` badge with hidden-eye icon for eligible draft rows in /Users/daniel/git/writerscheck.in/web/src/components/home/MeetingFeedItem.tsx
- [x] T031 [US3] Refactor My Meetings tab to compose `MeetingFeedItem` for each feed row in /Users/daniel/git/writerscheck.in/web/src/components/home/MyMeetingsTab.tsx

**Checkpoint**: User Story 3 is independently functional and visually aligned with the spec.

---

## Phase 6: User Story 4 - Browse Long Meeting Histories (Priority: P4)

**Goal**: Users can continuously load more meetings via infinite scroll without duplicates or list resets.

**Independent Test**: Scroll through at least three pages of meetings and confirm append-only behavior, duplicate prevention, and end-of-feed handling.

### Implementation for User Story 4

- [x] T032 [US4] Implement bottom-of-list infinite-scroll trigger in /Users/daniel/git/writerscheck.in/web/src/components/home/MyMeetingsTab.tsx
- [x] T033 [US4] Add loading sentinel and terminal end-of-feed state rendering in /Users/daniel/git/writerscheck.in/web/src/components/home/MyMeetingsTab.tsx
- [x] T034 [US4] Harden feed de-duplication and append semantics by `meetingId` in /Users/daniel/git/writerscheck.in/web/src/queries/useMyMeetingsQuery.ts
- [x] T035 [US4] Finalize backend cursor continuation behavior for long mixed-segment feeds in /Users/daniel/git/writerscheck.in/express/src/services/groupsService.ts

**Checkpoint**: User Story 4 is independently functional with stable infinite scrolling.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation sync and end-to-end validation across all stories.

- [x] T036 [P] Sync final read contract notes with implemented response fields in /Users/daniel/git/writerscheck.in/specs/010-my-meetings-tab/contracts/my-meetings-read-contract.md
- [x] T037 [P] Sync final query hook contract notes with implemented optimistic behavior in /Users/daniel/git/writerscheck.in/specs/010-my-meetings-tab/contracts/my-meetings-query-hooks-contract.md
- [x] T038 [P] Record final verification results and runbook notes in /Users/daniel/git/writerscheck.in/specs/010-my-meetings-tab/quickstart.md
- [x] T039 Run backend validation build in /Users/daniel/git/writerscheck.in/express/package.json
- [x] T040 Run frontend validation build in /Users/daniel/git/writerscheck.in/web/package.json
- [x] T041 Run frontend lint validation in /Users/daniel/git/writerscheck.in/web/package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; can begin immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers MVP list behavior.
- **Phase 4 (US2)**: Depends on Phase 2 and consumes US1 feed/query foundations.
- **Phase 5 (US3)**: Depends on Phase 2 and can proceed after US1 row data is available.
- **Phase 6 (US4)**: Depends on Phase 2 and is most effective after US1 query integration.
- **Phase 7 (Polish)**: Depends on completion of all targeted user stories.

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational phase.
- **US2 (P2)**: Independent after Foundational phase; shares the feed cache and row actions from US1.
- **US3 (P3)**: Independent after Foundational phase; consumes standardized feed item fields.
- **US4 (P4)**: Independent after Foundational phase; depends on infinite-query feed plumbing from US1.

### Within Each User Story

- Backend policy and contracts before frontend consumption.
- Query/mutation hooks before component wiring.
- Component wiring before final story validation.

## Parallel Opportunities

- Setup parallel tasks: T002, T003.
- Foundational parallel tasks: T005.
- US1 parallel tasks: T013.
- US2 parallel tasks: T020, T023.
- US3 parallel tasks: T027.
- Polish parallel tasks: T036, T037, T038.

---

## Parallel Example: User Story 1

```bash
Task: T013 Finalize segment sort/tie-break cursor behavior in express/src/models/groupMeetings.ts
Task: T015 Add feed response normalization for segment ordering in web/src/api/groups.ts
```

## Parallel Example: User Story 2

```bash
Task: T020 Persist check-in changes in express/src/models/meetingCheckins.ts
Task: T023 Implement drawer state controller hook in web/src/hooks/useMeetingCheckinDrawer.ts
```

## Parallel Example: User Story 3

```bash
Task: T027 Add date formatting helpers in web/src/lib/dateFormat.ts
Task: T030 Render admin-only draft badge in web/src/components/home/MeetingFeedItem.tsx
```

## Parallel Example: User Story 4

```bash
Task: T033 Add loading/end-of-feed state rendering in web/src/components/home/MyMeetingsTab.tsx
Task: T034 Harden meetingId de-duplication in web/src/queries/useMyMeetingsQuery.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate ordering, per-role visibility, and next-upcoming-per-group behavior.
4. Demo/deploy MVP.

### Incremental Delivery

1. Deliver US1 for feed visibility and ordering.
2. Deliver US2 for optimistic check-in drawer workflow.
3. Deliver US3 for full visual language and admin-only badge cues.
4. Deliver US4 for long-history infinite scrolling robustness.
5. Finish with Phase 7 contract/doc sync and validation.

### Parallel Team Strategy

1. One developer implements backend feed + check-in services (Phase 2, US1 backend, US2 backend).
2. One developer implements frontend queries/mutations/hooks (Phase 2, US1 query, US2 query).
3. One developer implements UI components and scroll behaviors (US3 and US4) after base hooks are available.

---

## Notes

- `[P]` tasks target different files and can be worked in parallel.
- Story labels map each task directly to an independently testable user story slice.
- Validation commands are intentionally grouped in the final phase for release readiness.
