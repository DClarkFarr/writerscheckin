# Tasks: Meeting Auto Publish

**Input**: Design documents from [/specs/016-meeting-auto-publish/](specs/016-meeting-auto-publish)
**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required for user stories), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts)

**Tests**: Tests are not explicitly requested in the feature specification, so this task list focuses on implementation and manual validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare scheduler runtime wiring and shared job/service scaffolding.

- [x] T001 Update cron cadence comments and scheduler wiring in express/src/server.ts
- [x] T002 Add strict typings for queue service fields and callbacks in express/src/services/QueueService.ts
- [x] T003 [P] Define scheduled publish job metadata and execution contract in express/src/jobs/AbstractJob.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core primitives required before story-specific behavior.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T004 Implement due-draft-meetings model query for trailing 20-minute computed publish window in express/src/models/groupMeetings.ts
- [x] T005 [P] Add stable due-meeting DTO types for scheduler discovery in express/src/services/groupMeetingsService.ts
- [x] T006 [P] Add idempotent attendee create-or-return helper for unique meeting/member pairs in express/src/models/meetingAttendees.ts
- [x] T007 [P] Add active publication recipient query helper excluding cancelled/removed memberships in express/src/models/groupMembers.ts
- [x] T008 Add publish batch result and per-meeting result interfaces in express/src/services/groupMeetingsService.ts

**Checkpoint**: Foundation ready for independent user story implementation.

---

## Phase 3: User Story 1 - Schedule Meeting Go-Live (Priority: P1) 🎯 MVP

**Goal**: Owners/admins can set occursAt plus publishHoursBefore and reliably derive the publish schedule.

**Independent Test**: Create or edit a meeting and verify returned schedule computes publish moment as occursAt minus publishHoursBefore.

- [x] T009 [US1] Add reusable publish-at computation helper for meeting schedule responses in express/src/services/groupMeetingsService.ts
- [x] T010 [US1] Ensure meeting create/update paths preserve and validate scheduling inputs (occursAt, publishHoursBefore) in express/src/models/groupMeetings.ts
- [x] T011 [US1] Include computed publish schedule fields in editable/detail meeting responses in express/src/services/groupMeetingsService.ts
- [x] T012 [P] [US1] Align meeting response types with computed schedule fields in web/src/api/types/groups.ts
- [x] T013 [US1] Surface computed publish schedule in meeting edit flow mapping in web/src/hooks/useMeetingForm.ts

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Automatic Publication and Notification (Priority: P2)

**Goal**: Scheduler auto-publishes due draft meetings, notifies active members, and creates invited attendees.

**Independent Test**: Run scheduler for a due draft meeting and verify publish status, emails, and invited attendee rows for active recipients.

- [x] T014 [US2] Implement service method to list due draft meetings from model discovery in express/src/services/groupMeetingsService.ts
- [x] T015 [US2] Implement per-meeting publish orchestration (state check, publish transition, result envelope) in express/src/services/groupMeetingsService.ts
- [x] T016 [US2] Create recipient fanout flow to create invited attendees idempotently in express/src/services/groupMeetingsService.ts
- [x] T017 [P] [US2] Add publish email composition helper using publishEmailMessage text in express/src/services/emailTemplates/groupMeetingPublish.ts
- [x] T018 [US2] Implement email dispatch integration for active recipients in express/src/services/groupMeetingsService.ts
- [x] T019 [US2] Implement batch publish service returning aggregate execution summary in express/src/services/groupMeetingsService.ts
- [x] T020 [US2] Implement job executor to call batch service and log terminal summaries only in express/src/jobs/PublishScheduledMeetings.ts

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Safe Reschedule and Failure Recovery (Priority: P3)

**Goal**: Reschedules/cancellations are respected and delayed scheduler runs recover without duplicates.

**Independent Test**: Cancel or reschedule before publish, then run delayed scheduler and verify only eligible meetings publish once with no duplicate side effects.

- [x] T021 [US3] Enforce skip rules for cancelled or already-published meetings during scheduled processing in express/src/services/groupMeetingsService.ts
- [x] T022 [US3] Ensure due-window logic catches late runs by processing trailing 20-minute publish window in express/src/models/groupMeetings.ts
- [x] T023 [US3] Guard against duplicate attendee creation and duplicate publish transitions in express/src/models/meetingAttendees.ts
- [x] T024 [P] [US3] Return explicit skip and recovery reasons in publish result payloads in express/src/services/groupMeetingsService.ts
- [x] T025 [US3] Add scheduler/job error handling to continue batch processing after per-meeting failures in express/src/jobs/PublishScheduledMeetings.ts

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, validation, and documentation updates.

- [ ] T026 [P] Update scheduler behavior notes and operational runbook details in express/README.md
- [x] T027 [P] Run build validation and fix type errors in express/src/services/groupMeetingsService.ts
- [ ] T028 Execute quickstart validation scenarios and capture outcomes in specs/016-meeting-auto-publish/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 2 completion; can proceed after US1 if shared schedule fields are needed.
- **Phase 5 (US3)**: Depends on Phase 4 because it extends scheduled publish behavior.
- **Phase 6 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; independent MVP slice.
- **US2 (P2)**: Starts after Phase 2; depends on foundational discovery/result primitives.
- **US3 (P3)**: Builds on US2 publish pipeline for resilience and idempotency.

### Within Each User Story

- Data/query primitives before orchestration.
- Orchestration before job wiring.
- Job wiring before end-to-end validation.

### Parallel Opportunities

- Phase 1: T003 can run in parallel with T001-T002.
- Phase 2: T005, T006, and T007 can run in parallel after T004 starts the discovery contract.
- US1: T012 can run in parallel after T011 defines response shape.
- US2: T017 can run in parallel with T015-T016.
- US3: T024 can run in parallel with T021-T023 once result envelope exists.
- Polish: T026 and T027 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T011 Include computed publish schedule fields in editable/detail meeting responses in express/src/services/groupMeetingsService.ts"
Task: "T012 Align meeting response types with computed schedule fields in web/src/api/types/groups.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T015 Implement per-meeting publish orchestration in express/src/services/groupMeetingsService.ts"
Task: "T017 Add publish email composition helper in express/src/services/emailTemplates/groupMeetingPublish.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T022 Ensure due-window logic catches late runs in express/src/models/groupMeetings.ts"
Task: "T024 Return explicit skip and recovery reasons in express/src/services/groupMeetingsService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate schedule computation and meeting edit/create flows.
4. Demo MVP scheduling behavior.

### Incremental Delivery

1. Deliver US1 for schedule configuration correctness.
2. Deliver US2 for automated publish + notification + attendee creation.
3. Deliver US3 for safe recovery and idempotent behavior under delayed runs.
4. Finish with Phase 6 polish and validation.

### Parallel Team Strategy

1. Team completes Setup and Foundational together.
2. After Phase 2:
   - Developer A: US1 schedule response and frontend mapping.
   - Developer B: US2 publish orchestration and job execution.
   - Developer C: US3 resilience and idempotency hardening once US2 scaffolding lands.

---

## Notes

- All tasks follow the required checklist format with sequential IDs.
- Story labels are present on user-story tasks only.
- [P] marks file-independent tasks that can run concurrently.
- File paths are explicit for each task to support direct execution by an implementation agent.
