# Tasks: Group Member/Admin Management Refactor

**Input**: Design documents from `/specs/007-group-member-admin-refactor/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: No dedicated test-writing tasks are included because the specification does not require a TDD workflow. Each user story includes an independent manual validation target.

**Organization**: Tasks are grouped by user story so each slice can be implemented and validated independently once foundational work is complete.

## Phase 1: Setup

**Purpose**: Confirm the current implementation surfaces that the refactor will replace.

- [x] T001 Review the current membership persistence and invite lifecycle code in `express/src/models/groupMembers.ts` and `express/src/models/groupModelCommon.ts`
- [x] T002 Review the current create/edit group payload flow in `express/src/services/groupsService.ts`, `web/src/api/types/groups.ts`, `web/src/api/groups.ts`, and `web/src/hooks/useGroupForm.ts`
- [x] T003 Review the current member picker UI in `web/src/components/forms/GroupUserMultiSelect.tsx` and `web/src/components/forms/GroupForm.tsx`

---

## Phase 2: Foundational

**Purpose**: Build the shared contract, persistence, and router foundations that block all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T004 Update unified `GroupMember` lifecycle types, validation helpers, and index definitions in `express/src/models/groupModelCommon.ts` and `express/src/models/groupMembers.ts`
- [x] T005 [P] Create shared membership lifecycle operations in `express/src/services/groupMembersService.ts`
- [x] T006 [P] Refactor group form DTOs to a unified `members` payload in `web/src/api/types/groups.ts` and `web/src/api/groups.ts`
- [x] T007 [P] Refactor shared frontend group-form state and normalization helpers for unified member rows in `web/src/hooks/useGroupForm.ts`
- [x] T008 Add member-management router scaffolding in `express/src/routers/membersRouter.ts` and register it in `express/src/routers/apiRouter.ts`
- [x] T009 Wire signup-time invite attachment into `express/src/services/authService.ts` and `express/src/services/groupMembersService.ts`

**Checkpoint**: Backend lifecycle rules, frontend payload types, and member routes are ready for story work.

---

## Phase 3: User Story 1 - Unified Member/Admin Add Flow (Priority: P1) 🎯 MVP

**Goal**: Replace separate admin/member pickers with one member flow that stores role on each selected row.

**Independent Test**: In create and edit flows, a user can add one person through a single picker, set that row to `admin` or `member`, and save without using separate admin/member controls.

- [x] T010 [US1] Refactor create/update group orchestration to consume unified member rows in `express/src/services/groupsService.ts`
- [x] T011 [US1] Update `POST /api/groups` and `PATCH /api/groups/:groupId` request handling for unified `members` input in `express/src/routers/groupsRouter.ts`
- [x] T012 [P] [US1] Replace separate admin/member selection state with a single selected-member list in `web/src/hooks/useGroupForm.ts`
- [x] T013 [US1] Replace dual admin/member sections with a single member management section in `web/src/components/forms/GroupForm.tsx`
- [x] T014 [US1] Update create and edit page integration for the unified form contract in `web/src/pages/group-create.tsx` and `web/src/pages/group-edit.tsx`

**Checkpoint**: Group create/edit uses one add-member flow instead of separate admin/member controls.

---

## Phase 4: User Story 2 - Smart Member Search (Priority: P1)

**Goal**: Only search after user input, debounce queries by 250ms, match partial names, and prioritize exact email matches.

**Independent Test**: Opening the picker performs no query; typing 2+ characters triggers a debounced search; exact email matches rank ahead of name matches.

- [x] T015 [P] [US2] Implement backend member search rules for 2-character minimum, partial-name matching, exact-email priority, and self exclusion in `express/src/services/memberSearchService.ts`
- [x] T016 [US2] Add `GET /api/members/search` with group-aware duplicate exclusion in `express/src/routers/membersRouter.ts`
- [x] T017 [P] [US2] Add debounced TanStack Query search helpers in `web/src/queries/memberQueries.ts`, `web/src/hooks/useMemberSearch.ts`, and `web/src/api/groups.ts`
- [x] T018 [US2] Refactor `react-select` search behavior to no-prequery mode with debounced lookup and updated empty-state messaging in `web/src/components/forms/GroupUserMultiSelect.tsx`
- [x] T019 [US2] Wire the debounced member search flow into form state in `web/src/hooks/useGroupForm.ts`

**Checkpoint**: Search is input-driven, debounced, and returns the correct ranking behavior.

---

## Phase 5: User Story 4 - Smart Member Display (Priority: P1)

**Goal**: Show avatar and display name for known users, and show email-focused rows for invite-only members.

**Independent Test**: A selected known user renders with avatar/name, while an invite-only row renders with the email address and invite status styling.

- [x] T020 [P] [US4] Add unified selected-member display types carrying avatar, display name, email, role, and status in `web/src/api/types/groups.ts` and `web/src/hooks/useGroupForm.ts`
- [x] T021 [US4] Create selected-member row rendering helpers in `web/src/components/forms/GroupMemberListItem.tsx`
- [x] T022 [US4] Render user-avatar rows versus invite-email rows in `web/src/components/forms/GroupUserMultiSelect.tsx` and `web/src/components/forms/GroupForm.tsx`

**Checkpoint**: Selected rows clearly distinguish known users from invite-only members.

---

## Phase 6: User Story 5 - Member Role and Deletion Actions (Priority: P1)

**Goal**: Every selected member row exposes inline role switching and delete actions, with create-mode local removal and edit-mode immediate persistence.

**Independent Test**: In create mode, clicking `X` removes the row locally; in edit mode, clicking `X` immediately marks the row removed on the server; role changes persist without waiting for full form submission.

- [x] T023 [P] [US5] Add role-update and soft-remove service operations and endpoints in `express/src/services/groupMembersService.ts` and `express/src/routers/membersRouter.ts`
- [x] T024 [US5] Add frontend API helpers for role updates and immediate removal in `web/src/api/groups.ts`
- [x] T025 [US5] Implement create-mode local delete and edit-mode immediate mutations in `web/src/hooks/useGroupForm.ts`
- [x] T026 [US5] Add inline role selector and delete controls to selected-member rows in `web/src/components/forms/GroupMemberListItem.tsx` and `web/src/components/forms/GroupUserMultiSelect.tsx`
- [x] T027 [US5] Keep edit-page member state in sync after inline role/delete actions in `web/src/pages/group-edit.tsx` and `web/src/hooks/useGroupForm.ts`

**Checkpoint**: Role changes and deletes work inline for selected members in both create and edit modes.

---

## Phase 7: User Story 3 - Invite Unknown Email Addresses (Priority: P2)

**Goal**: Allow valid unknown emails to be added as invite rows that later attach to a user account when signup occurs.

**Independent Test**: Typing an unknown valid email offers an invite option, selecting it creates an invite row, and a later signup with that email updates the same `GroupMember` record.

- [x] T028 [P] [US3] Extend `GroupMember` persistence for email-only invites, removed-row revival, and default `invited` status behavior in `express/src/models/groupMembers.ts` and `express/src/services/groupMembersService.ts`
- [x] T029 [US3] Support invite option creation and submission payload mapping in `web/src/hooks/useMemberSearch.ts`, `web/src/hooks/useGroupForm.ts`, and `web/src/api/types/groups.ts`
- [x] T030 [US3] Add invite-option UI, email validation feedback, and invite-only row handling in `web/src/components/forms/GroupUserMultiSelect.tsx` and `web/src/components/forms/GroupMemberListItem.tsx`
- [x] T031 [US3] Trigger invitation delivery and signup-attachment metadata handling in `express/src/services/groupsService.ts`, `express/src/services/groupMembersService.ts`, and `express/src/services/emailService.ts`

**Checkpoint**: Unknown emails can be invited, displayed, persisted, and later attached to real users.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, documentation, and validation work across all stories.

- [x] T032 [P] Update implementation-facing docs for the unified member payload in `express/README.md` and `web/README.md`
- [x] T033 [P] Reconcile feature docs and contracts with final request/response naming in `specs/007-group-member-admin-refactor/quickstart.md`, `specs/007-group-member-admin-refactor/contracts/group-member-management-api.md`, and `specs/007-group-member-admin-refactor/contracts/member-search-api.md`
- [x] T034 Validate the quickstart scenarios against the finished implementation and record any follow-up gaps in `specs/007-group-member-admin-refactor/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks every user story.
- **User Stories (Phases 3-7)**: Depend on Foundational completion.
- **Polish (Phase 8)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1**: Starts after Foundational and establishes the single member-flow contract.
- **US2**: Starts after Foundational and can proceed in parallel with US1, but its search hook is consumed by the final US1 UI.
- **US4**: Starts after Foundational and depends on the unified member row shape from US1.
- **US5**: Starts after Foundational and depends on the unified row rendering from US1 and US4.
- **US3**: Starts after Foundational and builds on the unified row shape plus search behavior from US2.

### Within Each User Story

- Backend contract and persistence changes come before frontend integration.
- Shared state changes come before UI wiring.
- Inline row actions come before edit-page cache synchronization.
- Each story should be manually validated at its checkpoint before moving on.

---

## Parallel Opportunities

- T005, T006, T007 can run in parallel after T004.
- T012 can run in parallel with T010-T011 once foundational DTO work is complete.
- T015 and T017 can run in parallel for US2.
- T020 can run in parallel with T021 once the unified member row shape is stable.
- T023 and T024 can run in parallel before T025-T027.
- T028 and T029 can run in parallel before T030-T031.
- T032 and T033 can run in parallel in the polish phase.

### Parallel Example: User Story 2

```bash
# Backend search behavior and frontend query wiring can proceed together:
Task: "Implement backend member search rules in express/src/services/memberSearchService.ts"
Task: "Add debounced TanStack Query search helpers in web/src/queries/memberQueries.ts, web/src/hooks/useMemberSearch.ts, and web/src/api/groups.ts"
```

### Parallel Example: User Story 5

```bash
# Backend inline actions and frontend API wiring can proceed together:
Task: "Add role-update and soft-remove service operations and endpoints in express/src/services/groupMembersService.ts and express/src/routers/membersRouter.ts"
Task: "Add frontend API helpers for role updates and immediate removal in web/src/api/groups.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: US1.
4. Complete Phase 4: US2.
5. Complete Phase 6: US5.
6. Validate the core add/search/role/delete loop before expanding scope.

### Incremental Delivery

1. Deliver unified add flow (US1).
2. Add smart search behavior (US2).
3. Add smart display polish (US4).
4. Add inline role/delete persistence (US5).
5. Add invite-only email flow (US3).
6. Finish with docs and quickstart validation.

### Suggested MVP Scope

The smallest useful release is **US1 + US2 + US5** because the unified flow is not practically usable without smart search and inline row actions.

---

## Notes

- `[P]` tasks touch different files and can be worked in parallel.
- Story labels map each task to the user story it delivers.
- Tasks target the current implementation surfaces already present in `express/src/` and `web/src/`.
- `spec.md` and `plan.md` disagree in one place about complete-name matching versus partial-name matching; these tasks follow the updated plan, research, quickstart, and contract docs: **partial name match + exact email match**.
