# Tasks: Convert Auth Forms

**Input**: Design documents from `/specs/002-convert-auth-forms/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual verification matrix in quickstart.md (no automated test suite requested; acceptance verified through end-to-end flow validation).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Setup and Foundational tasks establish project baseline; User Stories 1-3 can proceed in parallel after Foundational completion.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing auth endpoint wiring and establish baseline integration correctness

- [ ] T001 Verify login endpoint contract in `web/src/api/auth.ts` matches `express/src/routers/authRouter.ts` POST `/auth/login`
- [ ] T002 Verify sign-up endpoint contract in `web/src/api/auth.ts` matches `express/src/routers/authRouter.ts` POST `/auth/signup`
- [ ] T003 Verify reset-password endpoints in `web/src/api/auth.ts` match `express/src/routers/authRouter.ts` POST `/auth/reset-password/request` and `/auth/reset-password/confirm`
- [ ] T004 [P] Verify form hooks (`useLoginForm`, `useSignUpForm`, `useResetPasswordForm`, `useResetPasswordConfirmForm`) correctly wire to API methods in `web/src/api/auth.ts`
- [ ] T005 [P] Verify page routes in `web/src/routes/_auth/` are correctly wired to form pages (`login.tsx`, `sign-up.tsx`, `reset-password.tsx`)
- [ ] T006 Confirm `web/src/components/layout/AuthLayout.tsx` renders all three target auth pages without layout regressions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared design-system sizing and form control composition pattern

**⚠️ CRITICAL**: All user story form conversions depend on this phase completing

- [ ] T007 Define shared size tokens/classes for auth form inputs and buttons in `web/src/index.css` (e.g., `size-auth-default`, `size-auth-lg`) ensuring equivalent heights for same-tier controls
- [ ] T008 [P] Verify ShadCN UI primitives are available: `Field`, `FieldGroup`, `FieldLabel`, `Input`, `Button`, `InputGroup` via `web/src/components/ui/`
- [ ] T009 [P] Create a form control sizing reference/example in a non-target page to validate shared sizing pattern (e.g., comment in component or temporary test file)
- [ ] T010 Verify existing form error, focus, and disabled state styling is compatible with ShadCN Field/Input components via visual inspection in browser

**Checkpoint**: Shared sizing and ShadCN primitives ready - user story conversion can now begin

---

## Phase 3: User Story 1 - Sign In Reliably (Priority: P1) 🎯 MVP

**Goal**: Convert login form to ShadCN primitives with larger, consistent sizing while preserving existing authentication flow.

**Independent Test**: Can be tested by submitting valid/invalid credentials from `/login` and verifying outcomes match authentication behavior without regression (redirects on success, error message on invalid credentials, throttle feedback).

### Implementation for User Story 1

- [ ] T011 [US1] Replace form controls in `web/src/components/forms/LoginForm.tsx` to use `Field`, `FieldGroup`, `FieldLabel`, `Input` from ShadCN UI
- [ ] T012 [P] [US1] Apply shared size tokens to email `Input` in `web/src/components/forms/LoginForm.tsx`
- [ ] T013 [P] [US1] Apply shared size tokens to password `Input` in `web/src/components/forms/LoginForm.tsx`
- [ ] T014 [US1] Replace submit button in `web/src/components/forms/LoginForm.tsx` with ShadCN `Button` using shared size token and apply loading state during `isSubmitting`
- [ ] T015 [US1] Update form error display in `web/src/components/forms/LoginForm.tsx` to use ShadCN `Alert` component
- [ ] T016 [US1] Verify form maintains visible focus ring, error state styling, and disabled state on all controls in `web/src/components/forms/LoginForm.tsx`
- [ ] T017 [US1] Manual test: Submit valid credentials → verify redirect to authenticated area with no regression
- [ ] T018 [US1] Manual test: Submit invalid credentials → verify error message displays and form retains input context
- [ ] T019 [US1] Manual test: Submit form while throttled → verify rate-limit feedback message displays correctly

**Checkpoint**: User Story 1 (Login) is complete and independently testable

---

## Phase 4: User Story 2 - Create Account Successfully (Priority: P2)

**Goal**: Convert sign-up form to ShadCN primitives with larger, consistent sizing, maintaining field-level validation feedback.

**Independent Test**: Can be tested by submitting valid/invalid/duplicate sign-up data from `/sign-up` and verifying account creation behavior, field errors, and form-level error messaging without regression.

### Implementation for User Story 2

- [ ] T020 [P] [US2] Replace form controls in `web/src/components/forms/SignUpForm.tsx` to use `Field`, `FieldGroup`, `FieldLabel`, `Input` from ShadCN UI for firstName, lastName, email, password fields
- [ ] T021 [P] [US2] Apply shared size tokens to all four `Input` fields in `web/src/components/forms/SignUpForm.tsx`
- [ ] T022 [US2] Replace submit button in `web/src/components/forms/SignUpForm.tsx` with ShadCN `Button` using shared size token and apply loading state during `isSubmitting`
- [ ] T023 [US2] Update form error display in `web/src/components/forms/SignUpForm.tsx` to use ShadCN `Alert` component
- [ ] T024 [US2] Verify each input field in `web/src/components/forms/SignUpForm.tsx` shows error state only after blur/touch or after submission attempt (no over-validation)
- [ ] T025 [US2] Verify all controls in `web/src/components/forms/SignUpForm.tsx` have visible focus rings, error styling, and disabled state
- [ ] T026 [US2] Manual test: Submit valid sign-up data → verify account created and redirected to authenticated area with no regression
- [ ] T027 [US2] Manual test: Submit duplicate email → verify specific conflict message displays and form does not attempt account creation
- [ ] T028 [US2] Manual test: Submit invalid field values (empty names, invalid email, weak password) → verify field-level errors block submission
- [ ] T029 [US2] Manual test: Submit form while throttled → verify rate-limit feedback message displays correctly

**Checkpoint**: User Stories 1 and 2 are both complete and independently testable

---

## Phase 5: User Story 3 - Reset Password Access (Priority: P3)

**Goal**: Convert reset-password forms (request and confirm steps) to ShadCN primitives with larger, consistent sizing, preserving multi-step flow.

**Independent Test**: Can be tested by requesting a reset and confirming with valid/invalid codes/passwords from `/reset-password` and verifying flow transitions and feedback without regression.

### Implementation for User Story 3

- [ ] T030 [P] [US3] Replace form controls in `web/src/components/forms/ResetPasswordForm.tsx` to use `Field`, `FieldGroup`, `FieldLabel`, `Input` from ShadCN UI for email field
- [ ] T031 [P] [US3] Apply shared size token to email `Input` in `web/src/components/forms/ResetPasswordForm.tsx`
- [ ] T032 [US3] Replace submit button in `web/src/components/forms/ResetPasswordForm.tsx` with ShadCN `Button` using shared size token and apply loading state during `isSubmitting`
- [ ] T033 [US3] Update form error display in `web/src/components/forms/ResetPasswordForm.tsx` to use ShadCN `Alert` component
- [ ] T034 [US3] Verify email `Input` and button in `web/src/components/forms/ResetPasswordForm.tsx` have visible focus rings, error styling, and disabled state
- [ ] T035 [P] [US3] Replace form controls in `web/src/components/forms/ResetPasswordConfirmForm.tsx` to use `Field`, `FieldGroup`, `FieldLabel`, `Input` from ShadCN UI for email, code, password fields
- [ ] T036 [P] [US3] Apply shared size tokens to all three `Input` fields in `web/src/components/forms/ResetPasswordConfirmForm.tsx`
- [ ] T037 [US3] Replace submit button in `web/src/components/forms/ResetPasswordConfirmForm.tsx` with ShadCN `Button` using shared size token and apply loading state during `isSubmitting`
- [ ] T038 [US3] Update form error display in `web/src/components/forms/ResetPasswordConfirmForm.tsx` to use ShadCN `Alert` component
- [ ] T039 [US3] Verify all controls in `web/src/components/forms/ResetPasswordConfirmForm.tsx` have visible focus rings, error styling, and disabled state; email field should be read-only after transition from request step
- [ ] T040 [US3] Manual test: Request password reset with valid email → verify transition to confirm step with email pre-filled and read-only
- [ ] T041 [US3] Manual test: Submit confirm with valid code and password → verify success message and redirect to login
- [ ] T042 [US3] Manual test: Submit confirm with invalid/expired code → verify error message with recovery guidance
- [ ] T043 [US3] Manual test: Request reset → navigate away and back → verify form state coherence (no stale success/errors)
- [ ] T044 [US3] Manual test: Submit form while throttled → verify rate-limit feedback message displays correctly

**Checkpoint**: All user stories are complete and independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, accessibility, and consistency checks across all three converted forms

- [ ] T045 [P] Run `cd web && npm run lint` and verify no TypeScript or style errors in auth form components
- [ ] T045 [P] Run `cd web && npm run build` and `cd express && npm run build` to verify no compilation errors
- [ ] T046 Manual verify: Login, sign-up, and reset-password forms display consistent error message placement and styling
- [ ] T047 Manual verify: All primary inputs and submit buttons have matched heights across the three forms for equivalent size variants
- [ ] T048 Manual verify: All three auth pages display consistent focus rings (visible on all interactive elements)
- [ ] T049 Manual verify: All three auth pages display consistent disabled state styling
- [ ] T050 Manual verify: Loading state (spinner or button text change) is visible on submit buttons during request
- [ ] T051 Manual verify: Mobile viewport (< 768px) renders all three auth forms without horizontal scroll or layout shift
- [ ] T052 Manual verify: Desktop viewport (> 1024px) renders all three auth forms in centered card layout without regression
- [ ] T053 [P] Document conversion summary and link to quickstart.md validation results in feature notes

**Checkpoint**: Feature complete - all three auth forms converted to ShadCN with consistent sizing and visual states

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (confirms baseline contracts) - **BLOCKS all user stories**
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion (requires shared sizing tokens)
  - User stories can then proceed in parallel or sequentially
  - Each story should be independently completable and testable
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Login)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2 - Sign-up)**: Can start after Foundational (Phase 2) - Independently testable; does not depend on US1
- **User Story 3 (P3 - Reset Password)**: Can start after Foundational (Phase 2) - Independently testable; does not depend on US1 or US2

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (contract verification)
- All Foundational tasks marked [P] can run in parallel (ShadCN verification, sizing setup)
- Once Foundational phase completes, all three user stories can be worked on in parallel by different team members
- Within User Story 1: T012, T013 (input sizing) can run in parallel
- Within User Story 2: T020, T021 (form controls and sizing) can run in parallel
- Within User Story 3: T030-T032 (request form) and T035-T037 (confirm form) can run in parallel
- Phase 6 Polish tasks marked [P] can run in parallel (build/lint checks)

---

## Parallel Example: Full Feature With Three Developers

```
Setup Phase (Sequential):
  T001 → T002 → T003 → T004, T005 (parallel) → T006 ✓

Foundational Phase (Parallel as available):
  T007
  T008, T009 (parallel)
  T010

Then, with three developers working in parallel:
  Developer A: User Story 1  (T011 → T012, T013 (parallel) → T014 → T015 → T016 → T017, T018, T019)
  Developer B: User Story 2  (T020, T021 (parallel) → T022 → T023 → T024 → T025 → T026, T027, T028, T029)
  Developer C: User Story 3  (T030, T031 (parallel) → T032 → T033 → T034 ✓ T035, T036 (parallel) → T037 → T038 → T039 → T040, T041, T042, T043, T044)

Finally, Polish Phase (Parallel):
  T045, T045 (parallel) + T046, T047, T048, T049, T050, T051, T052 + T053
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (contract verification)
2. Complete Phase 2: Foundational (sizing tokens, ShadCN availability)
3. Complete Phase 3: User Story 1 (login form conversion)
4. **STOP and VALIDATE**: Test login form manually - verify it works without regression
5. Deploy/demo MVP (login working)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Login) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Sign-up) → Test independently → Deploy/Demo
4. Add User Story 3 (Reset Password) → Test independently → Deploy/Demo
5. Polish and cross-browser verification → Final release

### Notes

- Each user story (US1/US2/US3) is independently testable and deployable
- Preserve existing endpoint contracts - no backend changes required
- Keep hook/component separation intact - only form presentation changes
- Verify visual states (focus, error, disabled, loading) on each page
- Use quickstart.md validation matrix for acceptance verification
- Stop at any checkpoint to validate story independently
