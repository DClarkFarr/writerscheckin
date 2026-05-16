# Tasks: Meeting Check-in Timing

**Input**: Design documents from /specs/023-meeting-checkin-timing/
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated tests were not explicitly requested in the specification; this task list uses build/typecheck and manual validation tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: [ID] [P?] [Story] Description

- [P]: Can run in parallel (different files, no dependency on incomplete tasks)
- [Story]: User story label for story-phase tasks only ([US1], [US2], [US3])
- Every task includes explicit file path(s)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the feature docs and implementation checklist before code updates.

- [x] T001 Confirm implementation notes and validation order in specs/023-meeting-checkin-timing/quickstart.md
- [x] T002 Confirm rule wording alignment between specs/023-meeting-checkin-timing/spec.md and specs/023-meeting-checkin-timing/contracts/meeting-feed-checkin-ui-contract.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared logic needed before user-story implementation begins.

**CRITICAL**: User story tasks start only after this phase is complete.

- [x] T003 Add shared check-in availability state helpers for pre-open/open/closed transitions in web/src/hooks/useMemberMeetingDerivedState.ts
- [x] T004 Add shared disabled-reason/message helpers that remove day-of-meeting-only wording in web/src/lib/checkinWindowMessage.ts
- [x] T005 Update MemberMeetingDerivedState shape and helper outputs for unified feed/detail consumption in web/src/hooks/useMemberMeetingDerivedState.ts
- [x] T006 Document finalized availability/message invariants in specs/023-meeting-checkin-timing/contracts/checkin-eligibility-contract.md and specs/023-meeting-checkin-timing/contracts/meeting-feed-checkin-ui-contract.md

**Checkpoint**: Shared check-in state and messaging rules are defined and ready for story work.

---

## Phase 3: User Story 1 - Check In After Window Opens (Priority: P1) MVP

**Goal**: Allow check-in based on check-in window timing, including cross-day windows.

**Independent Test**: With a meeting whose check-in is open before meeting day, user can check in and sees no day-only restriction copy.

### Implementation for User Story 1

- [x] T007 [US1] Remove same-day gate from check-in enablement logic in web/src/components/home/MeetingFeedItem.tsx
- [x] T008 [US1] Replace day-of-meeting-only tooltip/disabled text in web/src/components/home/MeetingFeedItem.tsx
- [x] T009 [US1] Remove same-day gate from detail-page check-in enablement in web/src/pages/group-meeting-view.tsx
- [x] T010 [US1] Replace day-of-meeting-only disabled reason text in web/src/pages/group-meeting-view.tsx
- [x] T011 [US1] Ensure derived eligibility still honors upcoming+cutoff rules in web/src/hooks/useMemberMeetingDerivedState.ts
- [x] T012 [US1] Verify backend eligibility contract wording remains consistent with cross-day check-in behavior in express/src/services/meetingCheckinService.ts and express/src/routers/groupsRouter.ts

**Checkpoint**: Cross-day check-in behavior is functional in both feed and detail views.

---

## Phase 4: User Story 2 - See Accurate Live Countdown (Priority: P2)

**Goal**: Show second-by-second check-in countdown updates in supporting text.

**Independent Test**: During an active check-in window, supporting text countdown decrements every second for at least 5 seconds and transitions cleanly at close.

### Implementation for User Story 2

- [x] T013 [US2] Update active-window countdown messaging logic to support second-level updates independent of same-day matching in web/src/lib/checkinWindowMessage.ts
- [x] T014 [US2] Update feed timer lifecycle to run while active window is visible (including cross-day windows) in web/src/components/home/MeetingFeedItem.tsx
- [x] T015 [US2] Update detail-view timer lifecycle to run while active window is visible (including cross-day windows) in web/src/pages/group-meeting-view.tsx
- [x] T016 [P] [US2] Add close-boundary timer stop guards in web/src/components/home/MeetingFeedItem.tsx
- [x] T017 [P] [US2] Add close-boundary timer stop guards in web/src/pages/group-meeting-view.tsx
- [x] T018 [US2] Ensure supporting text state transitions (open -> closed) remain synchronized with formatter output in web/src/lib/checkinWindowMessage.ts, web/src/components/home/MeetingFeedItem.tsx, and web/src/pages/group-meeting-view.tsx

**Checkpoint**: Countdown text updates every second and transitions correctly in both UI surfaces.

---

## Phase 5: User Story 3 - Keep Button Label Stable (Priority: P3)

**Goal**: Keep pre-open action label static while countdown remains in supporting text.

**Independent Test**: Before check-in opens, button reads Check-in starts soon with no countdown value; timing details appear only below the button.

### Implementation for User Story 3

- [x] T019 [US3] Replace dynamic pre-open button label with static Check-in starts soon text in web/src/components/home/MeetingFeedItem.tsx
- [x] T020 [US3] Ensure countdown or timing strings render only in supporting text blocks (not action labels) in web/src/components/home/MeetingFeedItem.tsx
- [x] T021 [US3] Remove or refactor obsolete timeUntilCheckin helper usage after static label change in web/src/components/home/MeetingFeedItem.tsx
- [x] T022 [US3] Confirm contract wording explicitly prohibits countdown-in-button behavior in specs/023-meeting-checkin-timing/contracts/meeting-feed-checkin-ui-contract.md

**Checkpoint**: Button-label and supporting-text separation is complete and documented.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate implementation end-to-end and capture rollout evidence.

- [x] T023 [P] Run backend compile validation and record outcome in specs/023-meeting-checkin-timing/quickstart.md (command: cd express && npm run build)
- [x] T024 [P] Run frontend typecheck validation and record outcome in specs/023-meeting-checkin-timing/quickstart.md (command: cd web && npx tsc --noEmit)
- [ ] T025 Execute manual cross-day/open-window/countdown/static-label scenarios and capture findings in specs/023-meeting-checkin-timing/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies
- Phase 2 (Foundational): depends on Phase 1 and blocks all user stories
- Phase 3 (US1): depends on Phase 2
- Phase 4 (US2): depends on Phase 2 (can proceed after shared messaging/state helpers exist)
- Phase 5 (US3): depends on Phase 2 and should be applied after US2 timer/message updates in same file
- Phase 6 (Polish): depends on completed target stories

### User Story Dependencies

- US1 (P1): can start immediately after Foundational; no dependency on US2/US3
- US2 (P2): depends on foundational shared formatter/state helpers; independent of US1 implementation details
- US3 (P3): depends on finalized supporting-text countdown behavior from US2 in MeetingFeedItem

### Within Each User Story

- Shared helper updates before component/page wiring
- Availability logic before copy/tooltip refinements
- Timer lifecycle updates before boundary transition checks
- UI behavior changes before contract/documentation finalization

### Parallel Opportunities

- T016 and T017 can run in parallel (different files)
- T023 and T024 can run in parallel (different projects)

---

## Parallel Example: User Story 2

- Task: T016 Add close-boundary timer stop guards in web/src/components/home/MeetingFeedItem.tsx
- Task: T017 Add close-boundary timer stop guards in web/src/pages/group-meeting-view.tsx

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate cross-day check-in behavior independently
4. Demo/ship MVP if desired

### Incremental Delivery

1. Deliver US1 cross-day eligibility UX
2. Deliver US2 second-by-second countdown updates
3. Deliver US3 static label separation
4. Run Phase 6 validations and capture evidence

### Suggested MVP Scope

- MVP: Phase 1 + Phase 2 + Phase 3 (US1)

---

## Notes

- All tasks follow required checklist format with sequential IDs and explicit file paths.
- Story labels are only used in user-story phases.
- Tasks avoid introducing direct API calls from UI components and preserve existing architecture constraints.
