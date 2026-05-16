# Tasks: Real-time Meeting Updates

**Input**: Design documents from `/specs/022-realtime-meeting-updates/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are not explicitly requested in the feature spec; this task list uses build/typecheck and manual validation tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Every task includes concrete file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align feature docs and establish implementation surface before code changes.

- [x] T001 Align attendee-missing behavior wording across specs in specs/022-realtime-meeting-updates/spec.md and specs/022-realtime-meeting-updates/contracts/meeting-realtime-socket-contract.md
- [x] T002 Document final emitter trigger matrix in specs/022-realtime-meeting-updates/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared contracts/types and service scaffolding required before story work.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [x] T003 Add backend socket payload response types in express/src/services/socketEventsService.ts
- [x] T004 [P] Add frontend MeetingSocketPayload and nested document types in web/src/api/types/groups.ts
- [x] T005 Add reusable meeting payload mapper helpers using existing document mappers in express/src/services/socketEventsService.ts and express/src/services/groupMeetingsService.ts
- [x] T006 [P] Add query-cache update utility signatures for realtime meeting payloads in web/src/queries/useMyMeetingsQuery.ts

**Checkpoint**: Foundation ready - user story implementation can begin.

---

## Phase 3: User Story 1 - Receive member-scoped meeting updates (Priority: P1) 🎯 MVP

**Goal**: Emit `meeting` socket events only to eligible group-room recipients with per-user membership/attendee scoping.

**Independent Test**: Two users connected to same group room receive same meeting doc with recipient-scoped membership/attendee docs; sockets lacking required records receive no event.

### Implementation for User Story 1

- [x] T007 [US1] Implement socketGroupEmitMeetingItem(groupId, meetingId) with room socket discovery in express/src/services/socketEventsService.ts
- [x] T008 [US1] Resolve per-socket user membership and meeting attendee, and skip non-eligible recipients in express/src/services/socketEventsService.ts
- [x] T009 [US1] Emit `meeting` payload to room+socket target with normalized docs in express/src/services/socketEventsService.ts
- [x] T010 [US1] Wire emitter after check-in updates in express/src/routers/groupsRouter.ts
- [x] T011 [US1] Wire emitter after meeting edit/save operations in express/src/routers/groupsRouter.ts
- [x] T012 [US1] Wire emitter after publish meeting operations in express/src/routers/groupsRouter.ts
- [x] T013 [US1] Wire emitter after cancel meeting operations in express/src/routers/groupsRouter.ts
- [x] T014 [US1] Validate meeting/group lookup guardrails and non-throw skip behavior in express/src/services/socketEventsService.ts

**Checkpoint**: P1 realtime backend emission is functional and independently verifiable.

---

## Phase 4: User Story 2 - Frontend can reconstruct aggregate view model (Priority: P2)

**Goal**: Map `meeting` socket payloads into `MemberMeetingFeedItem` and update My Meetings cache in real time.

**Independent Test**: Incoming `meeting` socket payload updates existing feed items (or inserts new ones) in My Meetings tab without full refetch.

### Implementation for User Story 2

- [x] T015 [US2] Add payload-to-feed mapping function for MemberMeetingFeedItem in web/src/queries/useMyMeetingsQuery.ts
- [x] T016 [US2] Implement infinite-query cache upsert helper scoped to myMeetingsQueryKey in web/src/queries/useMyMeetingsQuery.ts
- [x] T017 [US2] Export query-owned realtime apply helper for external socket subscriber usage in web/src/queries/useMyMeetingsQuery.ts
- [x] T018 [US2] Subscribe to `meeting` socket events and delegate cache writes to query helper in web/src/hooks/useSubscribeSocketToGroups.ts
- [x] T019 [US2] Keep MyMeetingsTab wiring unchanged while consuming updated query behavior in web/src/components/home/MyMeetingsTab.tsx
- [x] T020 [US2] Add defensive ignore path for malformed meeting payloads in web/src/hooks/useSubscribeSocketToGroups.ts and web/src/queries/useMyMeetingsQuery.ts

**Checkpoint**: P2 frontend mapping and live query-cache updates are independently functional.

---

## Phase 5: User Story 3 - Event pattern consistency with existing group socket flow (Priority: P3)

**Goal**: Keep meeting emission consistent with existing group summary socket architecture for maintainability.

**Independent Test**: Meeting emitter follows same room socket lifecycle and targeted emission strategy as group summary emitter.

### Implementation for User Story 3

- [x] T021 [US3] Refactor shared room/socket iteration logic into consistent helper path in express/src/services/socketEventsService.ts
- [x] T022 [US3] Ensure group and meeting emitters use consistent guard/skip conventions in express/src/services/socketEventsService.ts
- [x] T023 [US3] Update inline service documentation/comments for the shared socket emission pattern in express/src/services/socketEventsService.ts

**Checkpoint**: P3 maintainability and pattern consistency goals are met.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup spanning all stories.

- [x] T024 [P] Run backend compile validation (`cd express && npm run build`) and record result notes in specs/022-realtime-meeting-updates/quickstart.md
- [x] T025 [P] Run frontend typecheck validation (`cd web && npx tsc --noEmit`) and record result notes in specs/022-realtime-meeting-updates/quickstart.md
- [ ] T026 Execute manual realtime verification scenarios from specs/022-realtime-meeting-updates/quickstart.md and capture notes in specs/022-realtime-meeting-updates/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Phase 1; blocks user stories
- **Phase 3 (US1)**: depends on Phase 2
- **Phase 4 (US2)**: depends on Phase 2 and consumes US1 payload contract
- **Phase 5 (US3)**: depends on US1 implementation surface
- **Phase 6 (Polish)**: depends on all implemented stories

### User Story Dependencies

- **US1 (P1)**: can begin immediately after Foundational; no dependency on other stories
- **US2 (P2)**: depends on US1 payload event and contract shape
- **US3 (P3)**: depends on US1 emitter existing so consistency refactor can be applied safely

### Within Each User Story

- Service/event contract before route trigger wiring
- Mapping helper before socket subscription usage
- Consistency refactors after functional behavior is stable

### Parallel Opportunities

- T004 and T006 can run in parallel during Foundational phase
- T024 and T025 can run in parallel during Polish phase

---

## Parallel Example: User Story 2

```bash
# In parallel after payload contract is stable:
Task: "Add payload-to-feed mapping function in web/src/queries/useMyMeetingsQuery.ts"
Task: "Subscribe to meeting socket events in web/src/hooks/useSubscribeSocketToGroups.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate recipient-scoped `meeting` emits manually
4. Demo backend realtime behavior

### Incremental Delivery

1. Deliver US1 backend emission
2. Deliver US2 frontend live cache mapping
3. Deliver US3 consistency refactor
4. Run final polish checks and manual scenario pass

### Suggested MVP Scope

- **MVP**: Phase 1 + Phase 2 + Phase 3 (US1)

---

## Notes

- All tasks follow required checklist format with IDs, optional `[P]`, required `[USx]` labels for story phases, and explicit file paths.
- Keep query ownership in `useMyMeetingsQuery` per constitution Principle XII.
- Preserve existing `group` event behavior while adding additive `meeting` event flow.
