# Tasks: Backfill Meeting Attendees

**Input**: Design documents from /specs/024-backfill-attendees/
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md
**Tests**: No TDD or explicit automated-test requirement was requested in spec.md; validation tasks are included as manual/integration verification steps.
**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: - [ ] [TaskID] [P?] [Story?] Description with file path

- [P] marks tasks that can run in parallel (different files, no blocking dependency)
- [Story] labels appear only in user-story phases ([US1], [US2], [US3])

---

## Phase 1: Setup (Shared Context)

**Purpose**: Confirm scope boundaries and align docs before implementation.

- [x] T001 Reconcile latest scope wording between specs/024-backfill-attendees/spec.md and specs/024-backfill-attendees/plan.md
- [x] T002 Update validation matrix placeholders in specs/024-backfill-attendees/quickstart.md for US1-US3 execution evidence
- [x] T003 Confirm contract assumptions in specs/024-backfill-attendees/contracts/membership-attendee-backfill-contract.md match current routes/services

**Checkpoint**: Scope and validation expectations are aligned.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared backfill primitives used by all membership-activation flows.

**CRITICAL**: Complete this phase before user-story implementation.

- [x] T004 Add eligible-meeting query helper for backfill candidate selection in express/src/models/groupMeetings.ts
- [x] T005 Add reusable membership-activation backfill function in express/src/services/groupMembersService.ts
- [x] T006 [P] Add typed backfill result shape (evaluated/created/existing counts) in express/src/services/groupMembersService.ts
- [x] T007 [P] Implement idempotent attendee creation loop using createMeetingAttendeeIfMissing in express/src/services/groupMembersService.ts
- [x] T008 Keep backfill side effects internal with no API response shape changes in express/src/services/groupMembersService.ts

**Checkpoint**: Backfill utility exists, is idempotent, and preserves existing API contracts.

---

## Phase 3: User Story 1 - See Previously Published Meetings After Joining (Priority: P1) 🎯 MVP

**Goal**: A newly accepted member sees eligible already-published meetings in My Meetings.

**Independent Test**: Publish a meeting, then accept invite or add member; meeting appears in My Meetings under normal app flow.

### Implementation for User Story 1

- [x] T009 [US1] Invoke backfill after successful accept in respondToGroupInvite() in express/src/services/groupMembersService.ts
- [x] T010 [US1] Invoke backfill after successful accept in respondToJoinGroupInvite() in express/src/services/groupInvitesService.ts
- [x] T011 [US1] Invoke backfill when member is created/updated with accepted status in addGroupMember() in express/src/services/groupMembersService.ts
- [x] T012 [US1] Emit existing realtime summary event after acceptance paths without adding new event contracts in express/src/routers/groupsRouter.ts
- [x] T013 [US1] Document US1 pass/fail manual scenario outcomes in specs/024-backfill-attendees/quickstart.md

**Checkpoint**: Late-accepted members can see eligible published meetings.

---

## Phase 4: User Story 2 - Backfill Attendee Records for Late Membership Events (Priority: P1)

**Goal**: All relevant membership activation paths create missing attendee rows exactly once.

**Independent Test**: Trigger invite acceptance, meeting-link acceptance, signup invite attach, and accepted add flows; each eligible meeting has one attendee row per member.

### Implementation for User Story 2

- [x] T014 [US2] Invoke backfill for accepted decision path in respondToMeetingInviteDecision() in express/src/services/groupInvitesService.ts
- [x] T015 [US2] Invoke backfill for auto-accepted invited memberships in attachUserToInvitedMembers() in express/src/services/groupMembersService.ts
- [x] T016 [US2] Verify signup flow reuses attached-membership backfill without duplicate calls in express/src/services/authService.ts
- [x] T017 [US2] Guard accepted-only transitions so non-accepted membership states do not trigger backfill in express/src/services/groupMembersService.ts
- [x] T018 [US2] Confirm duplicate-safe behavior under retried acceptance by preserving unique (meetingId, memberId) semantics in express/src/models/meetingAttendees.ts
- [x] T019 [US2] Update specs/024-backfill-attendees/contracts/membership-attendee-backfill-contract.md with final trigger coverage and eligibility details
- [x] T020 [US2] Record US2 idempotency and multi-meeting scenario outcomes in specs/024-backfill-attendees/quickstart.md

**Checkpoint**: All acceptance paths backfill attendees with no duplicates.

---

## Phase 5: User Story 3 - Interact With Backfilled Meetings Normally (Priority: P2)

**Goal**: Backfilled meetings behave like any other attendee meeting for detail view and actions.

**Independent Test**: Open a backfilled meeting and perform standard attendee interactions; existing timing/permission constraints apply unchanged.

### Implementation for User Story 3

- [x] T021 [US3] Verify and adjust attendance mapping for backfilled rows in member meeting responses in express/src/services/groupMeetingsService.ts
- [x] T022 [US3] Verify and adjust check-in transition handling from invited/backfilled attendance rows in express/src/services/meetingCheckinService.ts
- [x] T023 [P] [US3] Verify frontend normalization for backfilled attendance payloads in web/src/api/groups.ts
- [x] T024 [P] [US3] Verify My Meetings cache update behavior for backfilled meetings in web/src/queries/useMyMeetingsQuery.ts
- [x] T025 [US3] Capture US3 parity validation outcomes in specs/024-backfill-attendees/quickstart.md

**Checkpoint**: Backfilled meetings support normal attendee interactions with no special-case regressions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and release readiness checks.

- [x] T026 [P] Run backend typecheck/build for feature verification in express/package.json scripts
- [x] T027 [P] Run frontend typecheck for contract compatibility in web/package.json scripts
- [ ] T028 Execute full manual validation checklist and update evidence in specs/024-backfill-attendees/quickstart.md
- [x] T029 Confirm requirement checklist remains accurate in specs/024-backfill-attendees/checklists/requirements.md
- [x] T030 Summarize implementation deltas and residual risks in specs/024-backfill-attendees/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies
- Foundational (Phase 2): depends on Phase 1 and blocks all user stories
- User Story 1 (Phase 3): depends on Phase 2
- User Story 2 (Phase 4): depends on Phase 2 (can run in parallel with US1 after shared primitives are in place)
- User Story 3 (Phase 5): depends on US1 and US2 completion
- Polish (Phase 6): depends on all target user stories

### User Story Dependencies

- US1 (P1): baseline member visibility from accepted membership transitions
- US2 (P1): complete trigger coverage and idempotent backfill enforcement
- US3 (P2): behavior parity verification after US1/US2 data consistency is in place

### Parallel Opportunities

- T006 and T007 can run in parallel after T005 scaffolds the shared backfill routine.
- US1 and US2 phases can be executed in parallel by separate developers once Phase 2 is complete.
- T023 and T024 can run in parallel during US3 verification.
- T026 and T027 can run in parallel in final validation.

---

## Parallel Example: User Story 1

```bash
# After T009 is complete, these can proceed in parallel:
Task T010: Update accept flow in express/src/services/groupInvitesService.ts
Task T011: Update accepted add flow in express/src/services/groupMembersService.ts
```

## Parallel Example: User Story 2

```bash
# After shared backfill helper exists:
Task T014: Wire meeting-link acceptance trigger in express/src/services/groupInvitesService.ts
Task T015: Wire signup attach trigger in express/src/services/groupMembersService.ts
```

## Parallel Example: User Story 3

```bash
# Frontend verification tasks can run together:
Task T023: Verify payload normalization in web/src/api/groups.ts
Task T024: Verify cache behavior in web/src/queries/useMyMeetingsQuery.ts
```

---

## Implementation Strategy

### MVP First (US1)

1. Finish Setup and Foundational phases
2. Implement US1 tasks (T009-T013)
3. Validate independent US1 scenario in quickstart
4. Demo visibility fix for late-accepted members

### Incremental Delivery

1. Deliver MVP (US1)
2. Expand to full trigger/idempotency coverage (US2)
3. Validate interaction parity without unnecessary feature expansion (US3)
4. Run polish validations and finalize documentation
