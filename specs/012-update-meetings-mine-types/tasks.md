# Tasks: Meetings Mine Aggregation Alignment

**Input**: Design documents from `/specs/012-update-meetings-mine-types/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No dedicated automated test tasks are included because the specification and design docs call for build, lint, typecheck, and manual verification rather than a TDD or test-first workflow.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes a concrete file path target

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared contract surfaces for the aggregation-backed meetings/mine refactor.

- [x] T001 Rename meetings/mine shared API contracts to `MemberMeetingFeedItem` and `ListMemberMeetingsResponse` in `web/src/api/types/groups.ts`
- [x] T002 [P] Add derived-state helper scaffolding for aggregation-backed meeting rows in `web/src/hooks/useMemberMeetingDerivedState.ts`
- [x] T003 [P] Add enriched aggregation response type aliases for `membership`, `attendance`, and `counts` in `express/src/services/groupMeetingsService.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the backend and API-layer primitives required before any user story work can proceed.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Move meetings/mine aggregation execution helpers out of `express/src/services/groupMeetingsService.ts` into `express/src/models/groupMeetings.ts`
- [x] T005 [P] Add current-user meeting attendee lookup helpers for aggregation enrichment in `express/src/models/meetingAttendees.ts`
- [x] T006 [P] Expose multi-meeting attendance count aggregation helpers for page hydration in `express/src/models/meetingCheckins.ts`
- [x] T007 Fix meetings/mine cursor filtering and ordering to compare `occursAt` and `_id` in `express/src/models/groupMeetings.ts`
- [x] T008 Implement `populateMeetingsWithCounts()` orchestration and model-backed aggregation composition in `express/src/services/groupMeetingsService.ts`
- [x] T009 Update `GET /groups/meetings/mine` routing and `rows` response envelope handling in `express/src/routers/groupsRouter.ts`
- [x] T010 Replace legacy meetings/mine normalization with `rows`-based response parsing in `web/src/api/groups.ts`

**Checkpoint**: Foundation ready. Backend contract ownership, cursor semantics, and frontend API parsing are in place.

---

## Phase 3: User Story 1 - View My Meetings Correctly (Priority: P1) 🎯 MVP

**Goal**: Signed-in members can open My Meetings and see cards rendered from the new aggregation-backed response contract.

**Independent Test**: Load My Meetings for a user with past and upcoming meetings and confirm the list renders from `rows`, deduplicates by `meetingId`, and shows expected names, times, statuses, counts, and group context.

### Implementation for User Story 1

- [x] T011 [US1] Finalize `memberMeetingAggregationRowToResponse` to serialize `membership`, `attendance`, and `counts` as `MemberMeetingFeedItem` in `express/src/services/groupMeetingsService.ts`
- [x] T012 [US1] Update `useMyMeetingsQuery` to request, flatten, and deduplicate `rows` of `MemberMeetingFeedItem` in `web/src/queries/useMyMeetingsQuery.ts`
- [x] T013 [P] [US1] Implement reusable derived selectors for segment, attendance state, check-in eligibility, admin badge visibility, and display tone in `web/src/hooks/useMemberMeetingDerivedState.ts`
- [x] T014 [US1] Refactor meeting card rendering to consume `membership`, nested `attendance`, `counts`, and derived selectors in `web/src/components/home/MeetingFeedItem.tsx`
- [x] T015 [US1] Refactor My Meetings list rendering to use `MemberMeetingFeedItem` and `rows`-based query data in `web/src/components/home/MyMeetingsTab.tsx`

**Checkpoint**: User Story 1 should be fully functional and serve as the MVP for the feature.

---

## Phase 4: User Story 2 - Complete Meeting Actions From Updated Data (Priority: P2)

**Goal**: Users can still open downstream meeting actions and update attendance from My Meetings after the response contract change.

**Independent Test**: Open the check-in drawer and meeting detail link from a My Meetings card, change attendance, and verify the UI updates the selected card state without relying on removed server-derived fields.

### Implementation for User Story 2

- [x] T016 [US2] Refactor optimistic check-in cache updates to mutate nested `attendance` and `counts` instead of flat feed fields in `web/src/queries/useMeetingCheckinMutation.ts`
- [x] T017 [P] [US2] Update meeting check-in drawer typing and current-state rendering to use `MemberMeetingFeedItem` plus derived attendance selectors in `web/src/components/home/MeetingCheckinDrawer.tsx`
- [x] T018 [P] [US2] Update selected-meeting drawer state typing from `MyMeetingFeedItem` to `MemberMeetingFeedItem` in `web/src/hooks/useMeetingCheckinDrawer.ts`
- [x] T019 [US2] Rewire My Meetings drawer selection and submit flow around `MemberMeetingFeedItem` in `web/src/components/home/MyMeetingsTab.tsx`
- [x] T020 [US2] Derive card action affordances such as check-in CTA visibility and admin-only badge behavior from `membership`, `status`, and `occursAt` in `web/src/components/home/MeetingFeedItem.tsx`

**Checkpoint**: User Story 2 should preserve downstream actions and optimistic attendance updates using the new contract.

---

## Phase 5: User Story 3 - Handle Partial Or Unexpected Records Gracefully (Priority: P3)

**Goal**: My Meetings remains stable and user-friendly when optional fields, counts, or attendance rows are absent.

**Independent Test**: Load My Meetings with records missing optional display values and with meetings that have no attendee row or aggregate count row, then confirm the list, drawer, and empty/error states remain stable.

### Implementation for User Story 3

- [x] T021 [US3] Add backend serialization defaults for missing `attendance` and `counts` values in `express/src/services/groupMeetingsService.ts`
- [x] T022 [P] [US3] Harden meetings/mine API response normalization and optional-field fallbacks in `web/src/api/groups.ts`
- [x] T023 [P] [US3] Add partial-record fallback logic for derived meeting state in `web/src/hooks/useMemberMeetingDerivedState.ts`
- [x] T024 [US3] Update meeting card fallbacks for missing address, description, and count values in `web/src/components/home/MeetingFeedItem.tsx`
- [x] T025 [US3] Update My Meetings tab and check-in drawer empty/error/partial-record handling in `web/src/components/home/MyMeetingsTab.tsx` and `web/src/components/home/MeetingCheckinDrawer.tsx`

**Checkpoint**: User Story 3 should keep the meetings/mine experience resilient when data is partial or stale.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Sync documentation and run release-readiness validation across all stories.

- [x] T026 [P] Sync final `/groups/meetings/mine` response notes with implementation in `specs/012-update-meetings-mine-types/contracts/member-meetings-mine-contract.md`
- [x] T027 [P] Sync final derived-state and fallback notes in `specs/012-update-meetings-mine-types/contracts/member-meeting-derived-state-contract.md` and `specs/012-update-meetings-mine-types/data-model.md`
- [x] T028 [P] Record final implementation and manual verification notes in `specs/012-update-meetings-mine-types/quickstart.md`
- [x] T029 Run backend validation build in `express/package.json`
- [x] T030 Run frontend lint, build, and typecheck validation in `web/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 and delivers the MVP list rendering.
- **Phase 4 (US2)**: Depends on Phase 3 because it extends the rendered list interactions and optimistic state handling.
- **Phase 5 (US3)**: Depends on Phase 3 and can proceed alongside Phase 4 once the new contract is consumed in the UI.
- **Phase 6 (Polish)**: Depends on all targeted user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Independent after the foundational phase.
- **User Story 2 (P2)**: Builds on User Story 1 list consumption and interaction surfaces.
- **User Story 3 (P3)**: Builds on User Story 1 contract consumption and hardens it for edge cases.

### Within Each User Story

- Backend serialization changes should land before frontend consumers that depend on them.
- Query and mutation updates should land before component wiring.
- Shared derived selectors should land before card and drawer refactors that depend on them.

## Parallel Opportunities

- T002 and T003 can run in parallel during setup.
- T005 and T006 can run in parallel once T004 establishes model ownership boundaries.
- T013 can run in parallel with T012 after the shared type rename in T001 is complete.
- T017 and T018 can run in parallel during User Story 2.
- T022 and T023 can run in parallel during User Story 3.
- T026, T027, and T028 can run in parallel during polish.

---

## Parallel Example: User Story 1

```bash
Task: "Update useMyMeetingsQuery to request, flatten, and deduplicate rows of MemberMeetingFeedItem in web/src/queries/useMyMeetingsQuery.ts"
Task: "Implement reusable derived selectors for segment, attendance state, check-in eligibility, admin badge visibility, and display tone in web/src/hooks/useMemberMeetingDerivedState.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Update meeting check-in drawer typing and current-state rendering to use MemberMeetingFeedItem plus derived attendance selectors in web/src/components/home/MeetingCheckinDrawer.tsx"
Task: "Update selected-meeting drawer state typing from MyMeetingFeedItem to MemberMeetingFeedItem in web/src/hooks/useMeetingCheckinDrawer.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Harden meetings/mine API response normalization and optional-field fallbacks in web/src/api/groups.ts"
Task: "Add partial-record fallback logic for derived meeting state in web/src/hooks/useMemberMeetingDerivedState.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate My Meetings rendering against the new aggregation-backed contract.

### Incremental Delivery

1. Deliver User Story 1 to restore the primary My Meetings list.
2. Deliver User Story 2 to restore action flows and optimistic attendance updates.
3. Deliver User Story 3 to harden partial-data and empty-state behavior.
4. Finish with Phase 6 validation and documentation sync.

### Parallel Team Strategy

1. One developer can handle backend aggregation ownership and serialization work in Phase 2 while another updates shared frontend API parsing.
2. After Phase 2, one developer can take query and selector refactors for User Story 1 while another updates the meeting card component.
3. Once User Story 1 lands, one developer can take optimistic mutation and drawer wiring for User Story 2 while another hardens fallback behavior for User Story 3.

---

## Notes

- Every task follows the required checklist format with exact file paths.
- No automated test tasks were generated because the design docs specify validation commands and manual checks instead of an automated-test-first workflow.
- The suggested MVP scope is User Story 1 only.
