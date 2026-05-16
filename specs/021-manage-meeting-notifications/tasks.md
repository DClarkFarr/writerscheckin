# Tasks: Manage Group Meeting Notifications

**Input**: Design documents from `/specs/021-manage-meeting-notifications/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No explicit TDD/test-first requirement was requested in the feature spec, so this task list focuses on implementation and manual/compile validation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature scaffolding paths used by all stories.

- [x] T001 Create group notification settings route scaffold in web/src/routes/groups/$groupId/notifications.tsx
- [x] T002 Create group notification settings page scaffold in web/src/pages/group-notification-settings.tsx
- [x] T003 Add notification settings API type placeholders in web/src/api/types/groups.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Membership preference persistence and shared backend/frontend contracts required before story work.

**⚠️ CRITICAL**: Complete this phase before starting user story implementation.

- [x] T004 Extend membership schema types with unsubscribedNotifications in express/src/models/groupMembers.ts
- [x] T005 Implement validated normalization for unsubscribedNotifications keys in express/src/models/groupMembers.ts
- [x] T006 Add membership update support for set/unset unsubscribe flags in express/src/models/groupMembers.ts
- [x] T007 Add notification type and settings response interfaces in express/src/services/groupMembersService.ts
- [x] T008 [P] Add member notification settings DTOs in web/src/api/types/groups.ts
- [x] T009 [P] Add API client methods for member notification settings in web/src/api/groups.ts

**Checkpoint**: Persistence model and shared contracts are ready for story-specific implementation.

---

## Phase 3: User Story 1 - Access Group Notification Settings (Priority: P1) 🎯 MVP

**Goal**: Group members can find and open notification settings from the group view.

**Independent Test**: Open a group page and verify the top-area action navigates to `/groups/:groupId/notifications`.

- [x] T010 [US1] Add member-visible "Edit group notification settings" action near page top in web/src/pages/group-view.tsx
- [x] T011 [US1] Implement notification settings route wiring to page component in web/src/routes/groups/$groupId/notifications.tsx
- [x] T012 [US1] Build page-level header/breadcrumb and group-context load in web/src/pages/group-notification-settings.tsx
- [x] T013 [US1] Add route navigation coverage for member eligibility display logic in web/src/pages/group-view.tsx

**Checkpoint**: User Story 1 is navigable and independently demonstrable.

---

## Phase 4: User Story 2 - Review Notification Options Clearly (Priority: P1)

**Goal**: Members can view all required notification options in the requested list-item + switch layout.

**Independent Test**: Open notification settings page and verify all four options render with bold heading, subdued description, and right-aligned switch.

- [x] T014 [US2] Add backend read endpoint for member notification settings in express/src/routers/groupsRouter.ts
- [x] T015 [US2] Implement service read handler returning current unsubscribedNotifications state in express/src/services/groupMembersService.ts
- [x] T016 [P] [US2] Create notification settings query hook with stable query key in web/src/queries/useGroupNotificationSettingsQuery.ts
- [x] T017 [US2] Implement notification definition list (4 required settings) in web/src/pages/group-notification-settings.tsx
- [x] T018 [US2] Render Item/ItemTitle/ItemDescription/Switch row composition in web/src/pages/group-notification-settings.tsx
- [x] T019 [US2] Add loading and read-error UI states for settings fetch in web/src/pages/group-notification-settings.tsx

**Checkpoint**: User Story 2 displays all notification options clearly from persisted data.

---

## Phase 5: User Story 3 - Update Notification Preferences (Priority: P1)

**Goal**: Members can toggle preferences with persistence and delivery filtering based on truthy unsubscribe flags.

**Independent Test**: Toggle settings off/on, refresh page, and verify state persistence plus key add/remove semantics.

- [x] T020 [US3] Add PATCH member notification settings endpoint with payload validation in express/src/routers/groupsRouter.ts
- [x] T021 [US3] Implement subscribe/unsubscribe key set-unset service logic in express/src/services/groupMembersService.ts
- [x] T022 [US3] Implement model-level partial update for notification key writes/removals in express/src/models/groupMembers.ts
- [x] T023 [P] [US3] Add notification settings mutation hook with optimistic rollback in web/src/queries/useGroupNotificationSettingsMutation.ts
- [x] T024 [US3] Wire switch toggle handlers to PATCH mutation in web/src/pages/group-notification-settings.tsx
- [x] T025 [US3] Preserve unrelated setting states when toggling single key in web/src/pages/group-notification-settings.tsx
- [x] T026 [US3] Add failed-update feedback and restore last confirmed state in web/src/pages/group-notification-settings.tsx
- [x] T027 [US3] Add unsubscribe evaluation helper for recipients in express/src/services/groupMeetingsService.ts
- [x] T028 [US3] Apply unsubscribe filtering to meeting publication recipient send path in express/src/services/groupMeetingsService.ts
- [ ] T029 [US3] Apply unsubscribe filtering to meeting check-in availability emails in express/src/services/groupMeetingsService.ts
- [ ] T030 [US3] Apply unsubscribe filtering to meeting attendance summary/update email sends in express/src/services/groupMeetingsService.ts

**Checkpoint**: User Story 3 toggles persist correctly and unsubscribe flags suppress matching delivery events.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, validation, and documentation updates across stories.

- [x] T031 [P] Update API contract comments for new notification settings types in web/src/api/types/groups.ts
- [x] T032 Validate manual quickstart scenarios and record notes in specs/021-manage-meeting-notifications/quickstart.md
- [x] T033 Run backend compile validation using scripts declared in express/package.json
- [x] T034 Run frontend typecheck validation using scripts declared in web/package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies; start immediately.
- Foundational (Phase 2): Depends on Setup completion; blocks user stories.
- User Story phases (Phase 3-5): Depend on Foundational completion.
- Polish (Phase 6): Depends on completion of desired user stories.

### User Story Dependencies

- US1 (Phase 3): Starts after Foundational; independent of US2/US3.
- US2 (Phase 4): Starts after Foundational; can proceed independently of US1 except for route availability from T011.
- US3 (Phase 5): Starts after Foundational and benefits from US2 read flow but can be implemented independently for API/mutation behavior.

### Within Each User Story

- Backend endpoint/service tasks should precede frontend mutation/query wiring.
- Query/mutation hooks should precede page integration tasks.
- Delivery filtering tasks should follow unsubscribe update logic to reuse helper semantics.

## Parallel Opportunities

- Phase 2: T008 and T009 can run in parallel with backend schema tasks.
- US2: T016 can run in parallel with backend read endpoint tasks T014-T015 once API shape is stable.
- US3: T023 can run in parallel with backend PATCH implementation T020-T022 after DTO contracts are finalized.

## Parallel Example: User Story 3

```bash
# Parallel backend/frontend execution after contracts are stable:
Task: "T021 Implement subscribe/unsubscribe key set-unset service logic in express/src/services/groupMembersService.ts"
Task: "T023 Add notification settings mutation hook with optimistic rollback in web/src/queries/useGroupNotificationSettingsMutation.ts"

# Parallel delivery filtering slices:
Task: "T028 Apply unsubscribe filtering to meeting publication recipient send path in express/src/services/groupMeetingsService.ts"
Task: "T029 Apply unsubscribe filtering to meeting check-in availability emails in express/src/services/groupMeetingsService.ts"
Task: "T030 Apply unsubscribe filtering to meeting attendance summary/update email sends in express/src/services/groupMeetingsService.ts"
```

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate navigation path and member visibility behavior.

### Incremental Delivery

1. Deliver US1 route access.
2. Deliver US2 list rendering with persisted read state.
3. Deliver US3 toggle persistence and delivery filtering.
4. Run compile/typecheck and quickstart validation.

### Team Parallelization

1. One developer handles backend schema/service/router tasks.
2. One developer handles frontend route/page/query tasks.
3. Coordinate on DTO contract boundaries in `express/src/services/groupMembersService.ts` and `web/src/api/types/groups.ts`.
