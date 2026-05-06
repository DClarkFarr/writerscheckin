# Tasks: Cancel Published Meetings

**Input**: Design documents from `/specs/013-cancel-events/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No explicit TDD or test-first requirement was specified in the feature spec, so test tasks are not listed as separate checklist items.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align shared meeting contracts and mutation scaffolding for cancellation work.

- [x] T001 Add cancel endpoint response/input types in web/src/api/types/groups.ts
- [x] T002 Add cancel meeting API client function in web/src/api/groups.ts
- [x] T003 Create cancel meeting query hook in web/src/queries/useCancelMeetingMutation.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend and shared-state foundations that block all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Extend meeting status union to include cancelled in express/src/models/groupModelCommon.ts
- [x] T005 Add cancelledAt field (nullable) to meeting model definitions and normalization in express/src/models/groupMeetings.ts
- [x] T006 [P] Add cancelledAt to meeting response serialization contracts in express/src/services/groupMeetingsService.ts
- [x] T007 [P] Add cancelledAt and cancelled status to frontend meeting contracts in web/src/api/types/groups.ts
- [x] T008 Ensure canceled meetings remain included in existing meeting query paths in express/src/models/groupMeetings.ts
- [x] T009 Add backend guard preventing edit/update of canceled meetings in express/src/services/groupMeetingsService.ts
- [x] T010 Add backend guard preventing publish of canceled meetings in express/src/routers/groupsRouter.ts
- [x] T011 Add backend guard preventing check-in on canceled meetings in express/src/services/groupMeetingsService.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Cancel From Existing Action Points (Priority: P1) 🎯 MVP

**Goal**: Admin can cancel eligible published meetings from existing publish action locations.

**Independent Test**: In feed dropdown and meeting form, an admin can initiate cancellation for a published meeting, and non-eligible states do not expose cancel action.

### Implementation for User Story 1

- [x] T012 [US1] Implement cancel meeting model mutation that sets status and cancelledAt in express/src/models/groupMeetings.ts
- [ ] T013 [US1] Implement cancel meeting service orchestration and result mapping in express/src/services/groupMeetingsService.ts
- [x] T014 [US1] Add POST /groups/:groupId/meetings/:meetingId/cancel route in express/src/routers/groupsRouter.ts
- [x] T015 [P] [US1] Wire cancel action visibility and handler into MeetingFeedItem dropdown in web/src/components/home/MeetingFeedItem.tsx
- [x] T016 [P] [US1] Wire cancel action controls for published meetings in meeting form hook in web/src/hooks/useMeetingForm.ts
- [x] T017 [US1] Replace published-meeting publish card with cancel action card in web/src/components/forms/MeetingForm.tsx
- [x] T018 [US1] Connect edit page to cancellation action state in web/src/pages/group-meeting-edit.tsx

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Confirm Intent Before Canceling (Priority: P2)

**Goal**: Cancellation requires explicit confirmation with RSVP notification warning.

**Independent Test**: Starting cancellation always opens confirmation dialog; dismiss leaves state unchanged; confirm executes exactly one cancel request.

### Implementation for User Story 2

- [x] T019 [US2] Add cancellation confirmation state and handlers in web/src/hooks/useMeetingForm.ts
- [x] T020 [P] [US2] Add cancellation confirmation dialog state and handlers in web/src/components/home/MeetingFeedItem.tsx
- [x] T021 [US2] Render meeting-form confirmation dialog copy including RSVP notification warning in web/src/components/forms/MeetingForm.tsx
- [x] T022 [US2] Render feed-item confirmation dialog copy including RSVP notification warning in web/src/components/home/MeetingFeedItem.tsx
- [x] T023 [US2] Prevent duplicate cancellation submits while pending in web/src/hooks/useMeetingForm.ts
- [x] T024 [P] [US2] Prevent duplicate cancellation submits while pending in web/src/components/home/MeetingFeedItem.tsx
- [x] T025 [US2] Add cancellation success/error user feedback in web/src/queries/useCancelMeetingMutation.ts

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Preserve Clarity After Cancellation (Priority: P3)

**Goal**: Canceled meetings are clearly themed and non-interactive for edit/check-in workflows.

**Independent Test**: After cancellation, meeting surfaces show canceled visual state (dark orange + gray) and no edit/check-in actions are available.

### Implementation for User Story 3

- [ ] T026 [US3] Add canceled display tone mapping (dark orange + gray) in web/src/hooks/useMemberMeetingDerivedState.ts
- [ ] T027 [US3] Apply canceled card and action styling treatment in web/src/components/home/MeetingFeedItem.tsx
- [ ] T028 [US3] Disable check-in eligibility for canceled meetings in web/src/hooks/useMemberMeetingDerivedState.ts
- [ ] T029 [US3] Enforce canceled check-in disablement in drawer interactions in web/src/components/home/MeetingCheckinDrawer.tsx
- [ ] T030 [US3] Hide or disable edit affordances for canceled meetings in web/src/pages/group-meeting-view.tsx
- [ ] T031 [US3] Ensure meeting form renders non-editable canceled state in web/src/components/forms/MeetingForm.tsx
- [ ] T032 [US3] Ensure my-meetings query and cache updates preserve canceled rows in web/src/queries/useMyMeetingsQuery.ts

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks and documentation alignment.

- [ ] T033 [P] Update API and status notes for cancellation in specs/013-cancel-events/contracts/meeting-cancellation-contract.md
- [ ] T034 [P] Update UI behavior notes for canceled tone and restrictions in specs/013-cancel-events/contracts/cancelled-meeting-ui-state-contract.md
- [ ] T035 Run validation commands from quickstart in specs/013-cancel-events/quickstart.md
- [ ] T036 Perform manual verification checklist in specs/013-cancel-events/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on other stories.
- **US2 (P2)**: Starts after US1 wiring is in place (depends on cancel action entry points).
- **US3 (P3)**: Starts after US1 cancellation state exists; can proceed in parallel with late US2 cleanup once cancellation mutation flow is stable.

### Within Each User Story

- Backend lifecycle transition before frontend action wiring.
- Mutation hooks before UI trigger components.
- Derived-state rules before final visual/interaction polish.

## Parallel Opportunities

- **Foundational**: T006 and T007 can run in parallel after T005.
- **US1**: T015 and T016 can run in parallel after T014.
- **US2**: T020 and T024 can run in parallel with meeting-form confirmation tasks.
- **US3**: T029 and T030 can run in parallel after T028.
- **Polish**: T033 and T034 can run in parallel.

## Parallel Example: User Story 1

- Run T015 and T016 concurrently once T014 is complete.
- Then merge into T017 and T018 for final form/edit-page integration.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete Phase 3 (US1).
4. Validate admin can cancel from both entry points.
5. Demo MVP behavior.

### Incremental Delivery

1. Deliver US1 for core cancel workflow.
2. Deliver US2 for confirmation safety and messaging.
3. Deliver US3 for post-cancel clarity, restrictions, and styling.
4. Finish with polish validation and documentation updates.

### Parallel Team Strategy

1. One developer handles backend foundations (T004-T014).
2. One developer handles feed/form action wiring (T015-T025).
3. One developer handles canceled-state derived UI and restrictions (T026-T032).
4. Converge on polish and verification (T033-T036).
