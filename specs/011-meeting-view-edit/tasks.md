# Tasks: Meeting View And Edit

**Input**: Design documents from `/specs/011-meeting-view-edit/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No dedicated test tasks are included because the specification and user request define build, lint, and manual verification rather than a TDD or automated-test-first requirement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g. [US1], [US2], [US3])
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the feature scaffolding and shared type surfaces needed across backend and frontend work.

- [ ] T001 Add meeting detail, edit, autosave, and publish API/type interfaces in `web/src/api/types/groups.ts`
- [ ] T002 Add meeting detail, edit, autosave, and publish API functions in `web/src/api/groups.ts`
- [ ] T003 [P] Create the meeting view route shell in `web/src/routes/groups/$groupId/meetings/$meetingId/view.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared backend and frontend infrastructure that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Add meeting detail and admin edit DTO mappers plus shared authorization helpers in `express/src/services/groupMeetingsService.ts`
- [ ] T005 Add model helpers for meeting detail/edit lookups in `express/src/models/groupMeetings.ts`
- [ ] T006 [P] Add participant attendance lookup helpers in `express/src/models/meetingAttendees.ts`
- [ ] T007 Add separate member detail, admin edit-read, autosave patch, and publish routes in `express/src/routers/groupsRouter.ts`
- [ ] T008 [P] Create `useMeetingViewQuery` with `.key(...)` helper in `web/src/queries/useMeetingViewQuery.ts`
- [ ] T009 [P] Create `useEditableMeetingQuery` with `.key(...)` helper in `web/src/queries/useEditableMeetingQuery.ts`
- [ ] T010 [P] Create `useSaveMeetingMutation` with cache reconciliation in `web/src/queries/useSaveMeetingMutation.ts`
- [ ] T011 [P] Create `usePublishMeetingMutation` with edit/view cache reconciliation in `web/src/queries/usePublishMeetingMutation.ts`

**Checkpoint**: Foundation ready. User story implementation can now proceed.

---

## Phase 3: User Story 1 - View Meeting Details From Existing Meeting Lists (Priority: P1) 🎯 MVP

**Goal**: Users can open a breadcrumbed meeting details page from both the home feed and the group meetings section and see the meeting summary plus participant statuses.

**Independent Test**: Open a meeting from the home feed and from the group meetings section, confirm both routes land on the same meeting detail page, and verify the page shows breadcrumbs, address, description, and participant attendance states.

### Implementation for User Story 1

- [ ] T012 [US1] Implement the member-facing meeting detail service response in `express/src/services/groupMeetingsService.ts`
- [ ] T013 [US1] Implement the member-facing `GET /groups/:groupId/meetings/:meetingId` handler in `express/src/routers/groupsRouter.ts`
- [ ] T014 [P] [US1] Create the meeting detail page in `web/src/pages/group-meeting-view.tsx`
- [ ] T015 [P] [US1] Wire the view route component in `web/src/routes/groups/$groupId/meetings/$meetingId/view.tsx`
- [ ] T016 [US1] Add `view meeting` navigation to `web/src/components/home/MeetingFeedItem.tsx`
- [ ] T017 [US1] Add grouped `view` action controls to `web/src/components/group/GroupMeetingsSection.tsx`

**Checkpoint**: User Story 1 should now provide a complete, breadcrumbed meeting detail page reachable from existing meeting surfaces.

---

## Phase 4: User Story 2 - Update Personal Attendance From The Meeting View (Priority: P2)

**Goal**: Any eligible user can see and update their own attendance state directly from the meeting view page.

**Independent Test**: Open the meeting detail page as a member, change the attendance selection, refresh the page, and verify the user's status persists and remains visible near the top of the page.

### Implementation for User Story 2

- [ ] T018 [US2] Extend the meeting detail service payload with signed-in user check-in state and participant status reconciliation in `express/src/services/groupMeetingsService.ts`
- [ ] T019 [US2] Reuse or adapt meeting check-in eligibility/response handling for the view page in `express/src/services/meetingCheckinService.ts`
- [ ] T020 [US2] Integrate quick check-in UI and signed-in user status rendering in `web/src/pages/group-meeting-view.tsx`
- [ ] T021 [P] [US2] Reconcile meeting detail cache updates after attendance changes in `web/src/queries/useMeetingCheckinMutation.ts`

**Checkpoint**: User Story 2 should let a member update attendance from the meeting view page without leaving the screen.

---

## Phase 5: User Story 3 - Reach Meeting Editing Quickly As An Admin (Priority: P3)

**Goal**: Admins and owners can navigate to editing from every management-oriented meeting surface.

**Independent Test**: Sign in as an admin or owner and verify `edit meeting` is available from the home feed, the group meetings section, and the meeting view page header.

### Implementation for User Story 3

- [ ] T022 [US3] Implement the admin-only edit-read service response in `express/src/services/groupMeetingsService.ts`
- [ ] T023 [US3] Implement the admin-only `GET /groups/:groupId/meetings/:meetingId/edit` handler in `express/src/routers/groupsRouter.ts`
- [ ] T024 [US3] Add admin `edit meeting` navigation to `web/src/components/home/MeetingFeedItem.tsx`
- [ ] T025 [US3] Add grouped `edit` action controls to `web/src/components/group/GroupMeetingsSection.tsx`
- [ ] T026 [US3] Add the admin header edit action to `web/src/pages/group-meeting-view.tsx`

**Checkpoint**: User Story 3 should expose edit entry points consistently across admin-facing meeting surfaces.

---

## Phase 6: User Story 4 - Edit And Publish A Meeting With Low Friction (Priority: P4)

**Goal**: Admins and owners can edit meeting fields through debounced autosave, receive toast success feedback, and publish draft meetings explicitly from the edit page.

**Independent Test**: Open the edit page as an admin, change multiple fields and pause to trigger autosave, observe success feedback, then publish a draft meeting and verify the page updates to published state.

### Implementation for User Story 4

- [ ] T027 [P] [US4] Create the presentational meeting form in `web/src/components/forms/MeetingForm.tsx`
- [ ] T028 [P] [US4] Create the debounced autosave form hook in `web/src/hooks/useMeetingForm.ts`
- [ ] T029 [US4] Implement autosave patch handling and publish timing derivation in `express/src/services/groupMeetingsService.ts`
- [ ] T030 [US4] Implement the admin autosave `PATCH /groups/:groupId/meetings/:meetingId/edit` handler in `express/src/routers/groupsRouter.ts`
- [ ] T031 [US4] Implement the explicit draft publish `POST /groups/:groupId/meetings/:meetingId/publish` handler in `express/src/routers/groupsRouter.ts`
- [ ] T032 [US4] Replace the edit page shell with the full meeting editor, breadcrumbs, publish CTA, and helper text in `web/src/pages/group-meeting-edit.tsx`
- [ ] T033 [US4] Wire the edit route component to the completed page flow in `web/src/routes/groups/$groupId/meetings/$meetingId/edit.tsx`

**Checkpoint**: User Story 4 should deliver the complete autosaving editor and explicit draft publish workflow.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, regression checks, and quality passes across all stories.

- [ ] T034 [P] Update meeting-related empty/error/recovery states across `web/src/pages/group-meeting-view.tsx` and `web/src/pages/group-meeting-edit.tsx`
- [ ] T035 [P] Verify sparse patch payload handling and exact-optional-property usage in `web/src/hooks/useMeetingForm.ts` and `web/src/api/groups.ts`
- [ ] T036 Run feature validation steps from `specs/011-meeting-view-edit/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because it extends the meeting view page and its data payload.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and can proceed alongside User Story 2 after the core meeting view route exists.
- **User Story 4 (Phase 6)**: Depends on Foundational completion and User Story 3 because the admin edit route and entry points must exist first.
- **Polish (Phase 7)**: Depends on all targeted user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other user stories after Phase 2.
- **User Story 2 (P2)**: Builds directly on the meeting detail page from User Story 1.
- **User Story 3 (P3)**: Uses the same meeting detail and route context as User Story 1, but remains independently demonstrable once the view page exists.
- **User Story 4 (P4)**: Depends on the admin edit-read endpoint and edit entry points from User Story 3.

### Within Each User Story

- Backend DTO and route work should land before frontend integration that consumes those contracts.
- Query wrappers should be in place before pages and form hooks wire them into UI.
- Edit form hook wiring should precede final page-level publish and autosave UX polish.

### Parallel Opportunities

- T003 can run alongside T001 and T002.
- T006 can run alongside T005 once the shared service shape in T004 is defined.
- T008, T009, T010, and T011 can run in parallel after T001 and T002.
- T014 and T015 can run in parallel once T012 and T013 establish the detail contract.
- T021 can run in parallel with T020.
- T027 and T028 can run in parallel before T032 integrates them.
- T034 and T035 can run in parallel during polish.

---

## Parallel Example: User Story 1

```bash
Task: "Create the meeting detail page in web/src/pages/group-meeting-view.tsx"
Task: "Wire the view route component in web/src/routes/groups/$groupId/meetings/$meetingId/view.tsx"
```

## Parallel Example: User Story 4

```bash
Task: "Create the presentational meeting form in web/src/components/forms/MeetingForm.tsx"
Task: "Create the debounced autosave form hook in web/src/hooks/useMeetingForm.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate the breadcrumbed meeting detail page from both entry points.

### Incremental Delivery

1. Deliver User Story 1 to establish the meeting detail route and page.
2. Add User Story 2 to make the detail page interactive for attendees.
3. Add User Story 3 to expose admin edit entry points across the product.
4. Add User Story 4 to complete autosave editing and publish behavior.
5. Finish with Phase 7 validation and recovery-state polish.

### Parallel Team Strategy

1. One developer completes backend foundation tasks T004-T007 while another completes frontend query foundation tasks T008-T011 after setup.
2. After Phase 2, one developer can build the meeting detail page (US1/US2) while another adds admin action entry points (US3).
3. Once admin edit contracts are stable, a separate developer can complete the autosave form hook and presentational form for US4.

---

## Notes

- Every task follows the required checklist format with exact file paths.
- No automated test tasks were generated because the feature docs call for build, lint, and manual verification rather than explicit new automated tests.
- The smallest viable MVP is User Story 1: a breadcrumbed meeting detail page reachable from existing meeting lists.
