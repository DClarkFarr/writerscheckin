# Tasks: Group Meeting Models

**Input**: Design documents from `/specs/003-group-meeting-models/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated TDD requirement was explicitly requested in spec.md; validation is performed via `express` build checks and manual CRUD verification flows from quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation once foundational model infrastructure is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All tasks include exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish feature scaffolding for model-layer implementation

- [x] T001 Verify feature documentation alignment in `specs/003-group-meeting-models/spec.md`, `specs/003-group-meeting-models/plan.md`, and `specs/003-group-meeting-models/data-model.md` before coding
- [x] T002 Create model file stubs in `express/src/models/groups.ts`, `express/src/models/groupMembers.ts`, `express/src/models/groupMeetings.ts`, `express/src/models/meetingAttendees.ts`, and `express/src/models/meetingAttendanceLogs.ts`
- [x] T003 [P] Add initial exported type placeholders for all new entities in `express/src/models/groups.ts`, `express/src/models/groupMembers.ts`, `express/src/models/groupMeetings.ts`, `express/src/models/meetingAttendees.ts`, and `express/src/models/meetingAttendanceLogs.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared model primitives required by all user stories

**⚠️ CRITICAL**: No user story implementation should begin until this phase is complete

- [x] T004 Register new collection names in `express/src/models/collections.ts` for `groups`, `groupMembers`, `groupMeetings`, `meetingAttendees`, and `meetingAttendanceLogs`
- [x] T005 Create shared schedule/recurrence types and validation helpers in `express/src/models/groupModelCommon.ts` (15-minute minute-step, duration range, recurrence rule validation)
- [x] T006 [P] Create shared soft-delete query helper and timestamp helpers in `express/src/models/groupModelCommon.ts` for default active-record filtering
- [x] T007 Create index bootstrap function in `express/src/models/ensureIndexes.ts` that calls new `ensure...Indexes()` functions for all five new models
- [x] T008 Wire model index bootstrap into startup flow in `express/src/server.ts` after database initialization
- [x] T009 [P] Define shared status/role enums in `express/src/models/groupModelCommon.ts` for membership role, invite status, meeting status, and attendance status

**Checkpoint**: Foundational model infrastructure is ready; user stories can proceed

---

## Phase 3: User Story 1 - Configure Group Defaults (Priority: P1) 🎯 MVP

**Goal**: Provide CRUD and validation for group defaults used to generate meetings.

**Independent Test**: Create/read/update/soft-delete a group with valid schedule + recurrence settings and verify deleted groups are excluded by default queries.

### Implementation for User Story 1

- [x] T010 [US1] Implement `GroupDefinition`, `GroupBlueprint`, and `GroupDocument` types in `express/src/models/groups.ts`
- [x] T011 [US1] Implement `getGroupsCollection()` and `ensureGroupIndexes()` in `express/src/models/groups.ts`
- [x] T012 [US1] Implement `createGroup()` with schedule/duration/recurrence validation in `express/src/models/groups.ts`
- [x] T013 [US1] Implement `getGroupById()` and `listGroups()` with default soft-delete filtering in `express/src/models/groups.ts`
- [x] T014 [US1] Implement `updateGroupById()` with validation and `updatedAt` handling in `express/src/models/groups.ts`
- [x] T015 [US1] Implement `softDeleteGroupById()` in `express/src/models/groups.ts` that sets `deletedAt` and excludes records from default reads
- [x] T016 [US1] Add manual verification notes for group CRUD scenarios in `specs/003-group-meeting-models/quickstart.md`

**Checkpoint**: US1 is independently functional and verifiable

---

## Phase 4: User Story 2 - Manage Membership and Invites (Priority: P1)

**Goal**: Provide membership CRUD with role enforcement, invite metadata, and owner uniqueness.

**Independent Test**: Add owner/admin/member rows, perform valid invite status transitions, and verify owner uniqueness invariant is enforced.

### Implementation for User Story 2

- [x] T017 [US2] Implement `GroupMemberDefinition`, invite subdocument types, and document aliases in `express/src/models/groupMembers.ts`
- [x] T018 [US2] Implement `getGroupMembersCollection()` and `ensureGroupMemberIndexes()` in `express/src/models/groupMembers.ts`
- [x] T019 [US2] Implement `createGroupMember()` with role/invite validation and owner-uniqueness guard in `express/src/models/groupMembers.ts`
- [x] T020 [US2] Implement `getGroupMemberById()`, `listGroupMembersByGroupId()`, and `getGroupOwnerByGroupId()` in `express/src/models/groupMembers.ts`
- [x] T021 [US2] Implement `updateGroupMemberById()` with invite status transition validation in `express/src/models/groupMembers.ts`
- [x] T022 [US2] Implement `softDeleteGroupMemberById()` with default active-filter behavior in `express/src/models/groupMembers.ts`
- [x] T023 [US2] Document owner-transfer and invite-status manual checks in `specs/003-group-meeting-models/quickstart.md`

**Checkpoint**: US2 is independently functional and verifiable

---

## Phase 5: User Story 3 - Track Meetings and Attendance State (Priority: P2)

**Goal**: Provide meeting, attendee, and attendance-log models supporting draft/publish and attendance change logging.

**Independent Test**: Create a draft meeting, initialize attendees, update attendee status, and verify append-only attendance logs can be marked notified.

### Implementation for User Story 3

- [x] T024 [US3] Implement `GroupMeetingDefinition` types and collection/index functions in `express/src/models/groupMeetings.ts`
- [x] T025 [US3] Implement `createGroupMeeting()`, `getGroupMeetingById()`, and `listGroupMeetingsByGroupId()` with active filtering in `express/src/models/groupMeetings.ts`
- [x] T026 [US3] Implement `updateGroupMeetingById()`, `publishGroupMeetingById()`, and `softDeleteGroupMeetingById()` in `express/src/models/groupMeetings.ts`
- [x] T027 [P] [US3] Implement `MeetingAttendeeDefinition`, collection/index functions, and unique `(meetingId, memberId)` handling in `express/src/models/meetingAttendees.ts`
- [x] T028 [P] [US3] Implement attendee CRUD/status update functions in `express/src/models/meetingAttendees.ts` with enum validation
- [x] T029 [P] [US3] Implement `MeetingAttendanceLogDefinition`, collection/index functions, and `createMeetingAttendanceLog()` in `express/src/models/meetingAttendanceLogs.ts`
- [x] T030 [US3] Implement pending-log query and notification-marking methods in `express/src/models/meetingAttendanceLogs.ts`
- [x] T031 [US3] Add model-level helper to append attendance log records on attendee status changes in `express/src/models/meetingAttendees.ts`
- [x] T032 [US3] Add manual verification notes for meeting + attendee + notification-log flows in `specs/003-group-meeting-models/quickstart.md`

**Checkpoint**: US3 is independently functional and verifiable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate full feature quality and keep docs/contracts aligned

- [ ] T033 [P] Run `npm run build` in `express/` and fix any compile issues in `express/src/models/`
- [ ] T034 Validate all quickstart manual checks and record completion notes in `specs/003-group-meeting-models/quickstart.md`
- [ ] T035 [P] Reconcile final model method names and constraints with `specs/003-group-meeting-models/contracts/group-model-crud-contracts.md`
- [ ] T036 [P] Update `specs/003-group-meeting-models/data-model.md` to reflect any final field/type adjustments made during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; starts immediately
- **Phase 2 (Foundational)**: Depends on Setup; blocks all user stories
- **Phase 3 (US1)**: Depends on Foundational completion
- **Phase 4 (US2)**: Depends on Foundational completion
- **Phase 5 (US3)**: Depends on Foundational completion
- **Phase 6 (Polish)**: Depends on completion of selected user stories

### User Story Dependencies

- **US1 (P1)**: No dependency on US2/US3 once Foundational is done
- **US2 (P1)**: No dependency on US1/US3 once Foundational is done
- **US3 (P2)**: No strict dependency on US1/US2 once Foundational is done; references group/member IDs as foreign keys

### Within-Story Execution Rules

- Model type definitions before CRUD methods
- Collection/index setup before write-heavy methods
- Core CRUD before manual validation updates

### Parallel Opportunities

- T003 can run in parallel with T002 after stubs exist
- T006 and T009 can run in parallel during Foundational
- US1, US2, and US3 phases can be staffed in parallel after Foundational completion
- Within US3, T027, T028, and T029 are parallelizable across separate files
- In Polish, T033, T035, and T036 can run in parallel

---

## Parallel Examples

### User Story 1

```bash
# Parallel work in US1 after T010-T011:
Task: T012 Implement createGroup() validation in express/src/models/groups.ts
Task: T013 Implement read/list methods in express/src/models/groups.ts
```

### User Story 2

```bash
# Parallel work in US2 after T017-T018:
Task: T019 Implement createGroupMember() with owner guard in express/src/models/groupMembers.ts
Task: T020 Implement read/list/owner lookup methods in express/src/models/groupMembers.ts
```

### User Story 3

```bash
# Parallel work across separate model files:
Task: T027 Implement attendee types/indexes in express/src/models/meetingAttendees.ts
Task: T029 Implement attendance-log types/indexes/create in express/src/models/meetingAttendanceLogs.ts
Task: T024 Implement meeting types/indexes in express/src/models/groupMeetings.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete US1 tasks (T010-T016)
3. Validate independent test criteria for group CRUD + soft delete
4. Pause for review/demo before expanding scope

### Incremental Delivery

1. Foundation complete (Phase 1-2)
2. Deliver US1 (groups)
3. Deliver US2 (membership + invites)
4. Deliver US3 (meetings + attendance + logs)
5. Execute Polish phase and finalize docs

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Phase 2:
   - Developer A: US1 in `express/src/models/groups.ts`
   - Developer B: US2 in `express/src/models/groupMembers.ts`
   - Developer C: US3 across `express/src/models/groupMeetings.ts`, `express/src/models/meetingAttendees.ts`, `express/src/models/meetingAttendanceLogs.ts`
3. Merge at Phase 6 for final validation and documentation sync

---

## Notes

- All tasks follow the required checklist format with task IDs and file paths
- `[US1]`, `[US2]`, and `[US3]` labels are only used inside user story phases
- No automated tests were added because the spec did not explicitly request a TDD/automated-test mandate
- If automated tests are later requested, add contract/integration model tests under a follow-up phase without changing story structure
