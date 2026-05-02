# Tasks: Avatar Menu Logout

**Input**: Design documents from `/specs/004-avatar-menu-logout/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No explicit TDD or automated test-authoring requirement was specified in the feature spec; this task list focuses on implementation plus validation commands from quickstart.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared UI primitives and feature scaffolding for account-menu implementation.

- [x] T001 Add shadcn-style avatar primitive component in `web/src/components/ui/avatar.tsx`
- [x] T002 [P] Create account identity helper utilities (display name + initials) in `web/src/components/layout/accountMenuIdentity.ts`
- [x] T003 [P] Create account menu component scaffold with typed props in `web/src/components/layout/AccountMenu.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared behavior that all user stories depend on before story-specific work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Implement logout action hook using existing auth API + store state transitions in `web/src/hooks/useLogoutMenuAction.ts`
- [x] T005 [P] Add account-menu dropdown section structure and reusable layout classes in `web/src/components/layout/AccountMenu.tsx`
- [x] T006 [P] Wire `AccountMenu` import and authenticated branch integration point in `web/src/components/layout/Topbar.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Access Account Menu from Avatar (Priority: P1) 🎯 MVP

**Goal**: Replace the authenticated top-bar logout button with an avatar trigger that opens/closes a dropdown menu.

**Independent Test**: Sign in, verify avatar trigger is shown instead of logout button, open menu by clicking trigger, close menu via outside click and `Escape`.

### Implementation for User Story 1

- [x] T007 [US1] Replace authenticated `Log Out` button rendering with `AccountMenu` trigger in `web/src/components/layout/Topbar.tsx`
- [x] T008 [US1] Implement avatar trigger interaction and accessible label on dropdown trigger in `web/src/components/layout/AccountMenu.tsx`
- [x] T009 [US1] Ensure menu dismiss behavior (outside click and Escape) is preserved with shadcn `DropdownMenu` usage in `web/src/components/layout/AccountMenu.tsx`
- [x] T010 [US1] Preserve unauthenticated login-link behavior while refactoring authenticated branch in `web/src/components/layout/Topbar.tsx`

**Checkpoint**: User Story 1 should be fully functional and independently testable.

---

## Phase 4: User Story 2 - View Account Identity in Menu (Priority: P2)

**Goal**: Show user identity (name/email) at the top of the dropdown with deterministic avatar fallback.

**Independent Test**: Open menu and verify identity header is first; verify fallback initials/avatar color appear when avatar URL is missing.

### Implementation for User Story 2

- [x] T011 [US2] Implement identity header section (name + email) at top of menu content in `web/src/components/layout/AccountMenu.tsx`
- [x] T012 [P] [US2] Implement deterministic fallback derivation using existing color utility in `web/src/components/layout/accountMenuIdentity.ts`
- [x] T013 [US2] Render `Avatar` image/fallback states using identity helper outputs in `web/src/components/layout/AccountMenu.tsx`
- [x] T014 [US2] Add resilient text handling for long/missing identity fields (truncate + fallback labels) in `web/src/components/layout/AccountMenu.tsx`

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Log Out from Account Menu (Priority: P3)

**Goal**: Perform logout from dropdown action while preserving existing signed-out behavior.

**Independent Test**: Open dropdown, select Logout, verify server logout call occurs, client auth state clears, and post-logout navigation matches current behavior.

### Implementation for User Story 3

- [x] T015 [US3] Add destructive `Logout` menu item after identity section/separator in `web/src/components/layout/AccountMenu.tsx`
- [x] T016 [US3] Execute logout mutation (`api/auth.logout`) then clear auth store on success in `web/src/hooks/useLogoutMenuAction.ts`
- [x] T017 [US3] Surface logout pending/error feedback and prevent duplicate logout clicks in `web/src/components/layout/AccountMenu.tsx`
- [x] T018 [US3] Remove legacy direct `clearUser` logout click handling from `web/src/components/layout/Topbar.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates across all stories.

- [x] T019 [P] Run frontend static validation commands and address issues for files under `web/src/components/layout/Topbar.tsx`
- [x] T020 [P] Run backend compatibility build check (no auth contract regressions) for `express/src/routers/authRouter.ts`
- [x] T021 Document validation outcomes and edge-case results in `specs/004-avatar-menu-logout/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies, start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion; blocks all user stories.
- **Phases 3-5 (User Stories)**: Depend on Phase 2 completion.
- **Phase 6 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after foundational phase; delivers MVP.
- **US2 (P2)**: Starts after foundational phase and builds on shared `AccountMenu` structure from US1.
- **US3 (P3)**: Starts after foundational phase; depends on menu structure from US1 and identity section ordering from US2.

### Within Each User Story

- Build trigger/menu structure before styling refinements.
- Build identity helper logic before fallback rendering.
- Build logout hook behavior before wiring destructive menu action.

## Parallel Opportunities

- **Setup**: T002 and T003 can run in parallel after T001 starts.
- **Foundational**: T005 and T006 can run in parallel after T004 interface is defined.
- **US2**: T012 can run in parallel with T011, then both feed T013.
- **Polish**: T019 and T020 can run in parallel.

## Parallel Example: User Story 2

```bash
# Parallelizable tasks after US2 starts:
Task: "T011 [US2] Implement identity header section in web/src/components/layout/AccountMenu.tsx"
Task: "T012 [P] [US2] Implement deterministic fallback derivation in web/src/components/layout/accountMenuIdentity.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate avatar-triggered menu open/close behavior.
4. Demo/deploy MVP.

### Incremental Delivery

1. Deliver US1 (avatar trigger + dropdown mechanics).
2. Add US2 (identity header + fallback behavior).
3. Add US3 (logout action + feedback handling).
4. Finish with Phase 6 validation and quickstart documentation updates.

### Parallel Team Strategy

1. One developer implements shared foundation (`AccountMenu`, logout hook scaffolding).
2. One developer focuses on identity/fallback work (US2).
3. One developer focuses on logout action and feedback wiring (US3).
4. Converge for final polish and validation.

## Notes

- [P] tasks are scoped to different files to reduce merge conflicts.
- Task IDs are execution-ordered and mapped to user stories for traceability.
- This plan intentionally preserves existing backend auth contracts while changing authenticated top-bar UX.
