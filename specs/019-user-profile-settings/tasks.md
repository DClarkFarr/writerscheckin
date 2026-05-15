# Tasks: User Profile Settings

**Input**: Design documents from `/specs/019-user-profile-settings/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests were not explicitly requested in the specification; this task list focuses on implementation and manual validation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared endpoint and frontend API scaffolding for profile settings work.

- [x] T001 Create user profile request/response contract types in express/src/services/contracts/userProfile.ts
- [x] T002 Create frontend profile settings API module in web/src/api/users.ts
- [x] T003 [P] Add frontend profile settings type definitions in web/src/api/types/users.ts
- [x] T004 [P] Create profile settings UI directory scaffold in web/src/components/user/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement backend foundations required by all profile settings user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Add reusable user-name normalization and validation helpers in express/src/services/userService.ts
- [x] T006 [P] Export password rule validator for reuse from express/src/services/authService.ts
- [x] T007 Add user password update helper that touches passwordChangedAt in express/src/models/users.ts
- [x] T008 [P] Add session invalidation by user helper usage path in express/src/services/sessionService.ts
- [x] T009 Create profile settings service with session-user scoped operations in express/src/services/userProfileService.ts
- [x] T010 Register new session-authenticated user router mount in express/src/routers/apiRouter.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Access Profile Settings (Priority: P1) 🎯 MVP

**Goal**: Let authenticated users open a dedicated settings profile page from the top-right account dropdown.

**Independent Test**: While logged in, open the account dropdown, click Settings, and verify `/user/settings` renders the profile page shell with account context.

### Implementation for User Story 1

- [x] T011 [US1] Add user settings route file for `/user/settings` in web/src/routes/user/settings.tsx
- [x] T012 [US1] Create settings page container component in web/src/pages/user-settings.tsx
- [x] T013 [US1] Implement account context loading for settings page via existing me query in web/src/pages/user-settings.tsx
- [x] T014 [US1] Add Settings navigation item to the top-right account dropdown in web/src/components/layout/AccountMenu.tsx
- [x] T015 [US1] Add settings page layout section headers and form placeholders in web/src/pages/user-settings.tsx

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Change User Name (Priority: P1)

**Goal**: Allow users to update first and last name from a dedicated form on settings page.

**Independent Test**: Submit a valid name update, verify success feedback, and confirm updated name appears after refresh and in account menu identity.

### Implementation for User Story 2

- [x] T016 [US2] Implement session-authenticated PATCH `/profile` endpoint in express/src/routers/userRouter.ts
- [x] T017 [US2] Wire name update business logic (validation + persistence) in express/src/services/userProfileService.ts
- [x] T018 [US2] Ensure updateUserById model path supports partial firstName/lastName updates in express/src/models/users.ts
- [x] T019 [US2] Add frontend `updateUserProfile` API call in web/src/api/users.ts
- [x] T020 [US2] Create name-update form hook with blur/submit validation in web/src/hooks/useUpdateProfileForm.ts
- [x] T021 [US2] Create presentational name-update form component in web/src/components/user/ProfileSettingsForm.tsx
- [x] T022 [US2] Integrate name-update hook/component and me-query refresh in web/src/pages/user-settings.tsx

**Checkpoint**: User Stories 1 and 2 are independently functional.

---

## Phase 5: User Story 3 - Change Password (Priority: P1)

**Goal**: Allow users to change password by providing current password plus validated new password.

**Independent Test**: Submit valid current/new password, verify success message, confirm old password no longer works and new password does.

### Implementation for User Story 3

- [ ] T023 [US3] Implement session-authenticated PUT `/password` endpoint in express/src/routers/userRouter.ts
- [ ] T024 [US3] Implement current-password verification and new-password rule validation in express/src/services/userProfileService.ts
- [ ] T025 [US3] Add password hashing and passwordChangedAt update call in express/src/models/users.ts
- [ ] T026 [US3] Add session invalidation on successful password change in express/src/services/userProfileService.ts
- [ ] T027 [US3] Add password change audit logging in express/src/services/userProfileService.ts
- [ ] T028 [US3] Add frontend `changeUserPassword` API call in web/src/api/users.ts
- [ ] T029 [US3] Create password form hook with current/new/confirm validation in web/src/hooks/useChangePasswordForm.ts
- [ ] T030 [US3] Create password form component and integrate success/error handling in web/src/components/user/ChangePasswordForm.tsx
- [ ] T031 [US3] Integrate password form hook/component into settings page in web/src/pages/user-settings.tsx

**Checkpoint**: User Stories 1, 2, and 3 are independently functional.

---

## Phase 6: User Story 4 - View Email Address (Priority: P2)

**Goal**: Display account email in a permanently disabled field and hard-block email updates on backend profile endpoints.

**Independent Test**: Confirm email renders disabled in UI, cannot be edited/submitted, and backend rejects any email field injected into profile/password update requests.

### Implementation for User Story 4

- [ ] T032 [US4] Render email as disabled non-submitting input in settings page in web/src/pages/user-settings.tsx
- [ ] T033 [US4] Reject `email` field in profile update payload validation in express/src/services/userProfileService.ts
- [ ] T034 [US4] Reject `email` field in password change payload validation in express/src/services/userProfileService.ts
- [ ] T035 [US4] Ensure frontend API payload builders never include `email` for update endpoints in web/src/api/users.ts

**Checkpoint**: All user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration checks, docs alignment, and production-readiness verification.

- [ ] T036 [P] Update implementation validation notes with profile settings flow in specs/019-user-profile-settings/quickstart.md
- [ ] T037 Run backend compile validation command `cd express && npm run build` documented in express/package.json
- [ ] T038 Run frontend typecheck validation command `cd web && npx tsc --noEmit` documented in web/package.json
- [ ] T039 Execute manual end-to-end validation for all profile settings acceptance scenarios in specs/019-user-profile-settings/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story Phases (Phase 3-6)**: Depend on Foundational completion.
- **Polish (Phase 7)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on other user stories.
- **US2 (P1)**: Starts after Phase 2 and depends on US1 settings page entry point for UI integration.
- **US3 (P1)**: Starts after Phase 2 and depends on US1 settings page entry point for UI integration.
- **US4 (P2)**: Starts after Phase 2 and hardens both US2 and US3 endpoint/UI flows.

### Within Each User Story

- Backend endpoint/service wiring precedes frontend hook and form integration.
- API client methods precede hook mutation wiring.
- Hook state/validation logic precedes page-level form integration.
- Story-level validation follows core implementation completion.

### Parallel Opportunities

- T003 and T004 can run in parallel after T002.
- T006 and T008 can run in parallel with T005/T007.
- T019 and T020 can proceed in parallel after T016-T018.
- T028 and T029 can proceed in parallel after T023-T027.
- T036 can run in parallel with T037 and T038.

---

## Parallel Example: User Story 1

```bash
# Route and menu entry can be implemented in parallel
Task: "Add user settings route file for `/user/settings` in web/src/routes/user/settings.tsx"
Task: "Add Settings navigation item to the top-right account dropdown in web/src/components/layout/AccountMenu.tsx"
```

## Parallel Example: User Story 2

```bash
# API client and form hook can be built in parallel after backend patch endpoint exists
Task: "Add frontend `updateUserProfile` API call in web/src/api/users.ts"
Task: "Create name-update form hook with blur/submit validation in web/src/hooks/useUpdateProfileForm.ts"
```

## Parallel Example: User Story 3

```bash
# Password API client and form hook can be built in parallel after backend password flow exists
Task: "Add frontend `changeUserPassword` API call in web/src/api/users.ts"
Task: "Create password form hook with current/new/confirm validation in web/src/hooks/useChangePasswordForm.ts"
```

## Parallel Example: User Story 4

```bash
# UI and backend hardening tasks can proceed in parallel
Task: "Render email as disabled non-submitting input in settings page in web/src/pages/user-settings.tsx"
Task: "Reject `email` field in profile update payload validation in express/src/services/userProfileService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate settings page navigation and page shell behavior.
4. Demo/deploy MVP if accepted.

### Incremental Delivery

1. Deliver US1 (settings navigation and page shell).
2. Deliver US2 (name update form and persistence).
3. Deliver US3 (password change with security checks).
4. Deliver US4 (email display-only hardening + backend rejection).
5. Run compile/typecheck/manual validation and finalize docs.

### Parallel Team Strategy

1. Backend developer: user router + profile service + model updates.
2. Frontend developer A: route/menu/settings page shell.
3. Frontend developer B: profile/password hooks and form components.
4. Joint validation pass for acceptance scenarios and security constraints.

---

## Notes

- All tasks follow the required checklist format with task ID and file path.
- [P] is used only for tasks with no blocking file or sequencing dependency.
- Story labels are present only in user story phases.
- Endpoint tasks enforce session-based authentication and avoid user ID path parameters.
- No tasks introduce new collections or collection fields.
