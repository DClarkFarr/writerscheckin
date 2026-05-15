# Tasks: Control Check-In Period

**Input**: Design documents from `/specs/020-control-checkin-period/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No explicit TDD requirement in spec; implementation tasks include build/typecheck and manual validation from quickstart.

**Organization**: Tasks are grouped by user story so each story is independently implementable and testable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and shared constants used by later phases.

- [x] T001 Add check-in cutoff default constants in express/src/services/groupsService.ts
- [x] T002 [P] Add frontend check-in message formatter utility in web/src/lib/checkinWindowMessage.ts
- [x] T003 [P] Add shared date utility exports for cutoff display usage in web/src/lib/dateFormat.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Introduce shared data contracts required by all user stories.

**⚠️ CRITICAL**: No user story implementation starts until these are complete.

- [x] T004 Add endCheckinHoursBefore field and validation to group model in express/src/models/groups.ts
- [x] T005 Add endCheckinHoursBefore field and validation to meeting model in express/src/models/groupMeetings.ts
- [x] T006 [P] Extend backend meeting/group response interfaces for cutoff metadata in express/src/services/groupMeetingsService.ts
- [x] T007 [P] Extend frontend API types for cutoff fields/metadata in web/src/api/types/groups.ts

**Checkpoint**: Shared schema and contracts are in place for all stories.

---

## Phase 3: User Story 1 - Configure Group Check-In Cutoff (Priority: P1) 🎯 MVP

**Goal**: Admins can create/edit a group-level numeric check-in cutoff value.

**Independent Test**: Edit a group, set a valid cutoff number, save, reload group form, and confirm value persists; invalid values are rejected.

### Implementation for User Story 1

- [x] T008 [US1] Accept and persist endCheckinHoursBefore in group create/update service payloads in express/src/services/groupsService.ts
- [x] T009 [US1] Wire endCheckinHoursBefore request/response mapping in group routes in express/src/routers/groupsRouter.ts
- [x] T010 [US1] Normalize and expose endCheckinHoursBefore in group API client transforms in web/src/api/groups.ts
- [x] T011 [US1] Add endCheckinHoursBefore to group draft and editable types in web/src/api/types/groups.ts
- [x] T012 [US1] Add field state, validation, and payload mapping for endCheckinHoursBefore in web/src/hooks/useGroupForm.ts
- [x] T013 [US1] Add numeric input labeled "Check-in closes (hours before start)" to group form UI in web/src/components/forms/GroupForm.tsx
- [x] T014 [US1] Preload existing group cutoff into edit page form defaults in web/src/pages/group-edit.tsx

**Checkpoint**: Admin can manage group-level check-in cutoff end hour value end-to-end.

---

## Phase 4: User Story 2 - Inherit Cutoff Into Meetings (Priority: P1)

**Goal**: Newly created meetings inherit the group cutoff value and retain it after creation.

**Independent Test**: Set group cutoff, create upcoming meeting, verify meeting stores inherited value; change group cutoff and verify new meeting inherits updated value while old meeting remains unchanged.

### Implementation for User Story 2

- [x] T015 [US2] Inherit endCheckinHoursBefore when creating upcoming meetings from group defaults in express/src/services/groupMeetingsService.ts
- [x] T016 [US2] Ensure create meeting model input includes inherited endCheckinHoursBefore in express/src/models/groupMeetings.ts
- [x] T017 [US2] Include meeting cutoff field/metadata in meeting detail response mapper in express/src/services/groupMeetingsService.ts
- [x] T018 [P] [US2] Include meeting cutoff field/metadata in member meeting feed mapper in express/src/services/groupMeetingsService.ts
- [x] T019 [P] [US2] Normalize inherited meeting cutoff field/metadata in API client mappings in web/src/api/groups.ts

**Checkpoint**: Meeting creation consistently persists inherited cutoff value and exposes it to UI consumers.

---

## Phase 5: User Story 3 - Enforce and Explain Check-In Window (Priority: P1)

**Goal**: Check-in is blocked after cutoff and every check-in button surface explains the time limit.

**Independent Test**: For a meeting where cutoff has passed but start time is still future, check-in controls are disabled, endpoint returns conflict, and UI shows cutoff-ended explanation plus correctly formatted time-limit message.

### Implementation for User Story 3

- [x] T020 [US3] Enforce cutoff-window validation in check-in mutation service in express/src/services/meetingCheckinService.ts
- [x] T021 [US3] Update meeting canCheckin computation to include cutoff logic in express/src/services/groupMeetingsService.ts
- [x] T022 [US3] Return conflict-style cutoff-ended error message contract from check-in route flow in express/src/routers/groupsRouter.ts
- [x] T023 [US3] Update derived check-in availability logic to use cutoff metadata in web/src/hooks/useMemberMeetingDerivedState.ts
- [x] T024 [US3] Add cutoff time-limit message and disabled explanation tooltip in meeting detail check-in actions in web/src/pages/group-meeting-view.tsx
- [x] T025 [US3] Add cutoff time-limit message and disabled explanation tooltip in feed card check-in actions in web/src/components/home/MeetingFeedItem.tsx
- [x] T026 [US3] Add cutoff time-limit message and disabled explanation tooltip in drawer check-in actions in web/src/components/home/MeetingCheckinDrawer.tsx
- [x] T027 [P] [US3] Ensure check-in mutation error mapping shows cutoff-ended user message in web/src/queries/useMeetingCheckinMutation.ts

**Checkpoint**: Check-in endpoint and all UI surfaces consistently enforce and explain cutoff behavior.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks, cleanup, and validation.

- [x] T028 [P] Update feature documentation examples for new cutoff field in specs/020-control-checkin-period/quickstart.md
- [x] T029 Run backend compile validation from express/package.json using npm run build
- [x] T030 Run frontend typecheck validation from web/package.json using npx tsc --noEmit
- [ ] T031 Execute manual validation scenarios and record outcomes in specs/020-control-checkin-period/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies.
- Foundational (Phase 2): depends on Setup; blocks all user stories.
- User Story phases (3-5): depend on Foundational completion.
- Polish (Phase 6): depends on all implemented user stories.

### User Story Dependencies

- US1 (Configure Group Cutoff): starts immediately after Foundational.
- US2 (Meeting Inheritance): depends on US1 persisted group field.
- US3 (Enforce and Explain Window): depends on Foundational, and consumes US2 cutoff metadata in read surfaces.

### Within Each User Story

- Backend contracts and persistence before frontend form/UI wiring.
- Read model updates before derived-state and component behavior.
- Mutation error mapping after endpoint enforcement behavior is finalized.

---

## Parallel Opportunities

- T002 and T003 can run in parallel.
- T006 and T007 can run in parallel.
- T018 and T019 can run in parallel after T017.
- T027 can run in parallel with T024-T026 once T020-T023 are complete.
- T028 can run in parallel with T029-T030.

---

## Parallel Example: User Story 3

```bash
# After T020-T023 are complete, run UI updates in parallel:
T024 web/src/pages/group-meeting-view.tsx
T025 web/src/components/home/MeetingFeedItem.tsx
T026 web/src/components/home/MeetingCheckinDrawer.tsx

# Then run error mapping in parallel with cleanup:
T027 web/src/queries/useMeetingCheckinMutation.ts
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks (T008-T014).
3. Validate independent US1 test criteria.

### Incremental Delivery

1. Deliver US1 (group cutoff configuration).
2. Deliver US2 (meeting inheritance of cutoff).
3. Deliver US3 (endpoint enforcement + UI messaging).
4. Finish with Phase 6 validation and documentation updates.

### Team Parallel Strategy

1. One engineer on backend persistence/contracts (T004-T022).
2. One engineer on frontend forms/types (T010-T014, T019).
3. One engineer on check-in surfaces UX (T023-T027) once contracts are stable.

---

## Notes

- All tasks follow required checklist format: `- [ ] T### [P?] [US?] Description with file path`.
- Story labels are applied only to user story phases.
- Tasks are written to be executable without additional context.
