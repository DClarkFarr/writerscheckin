# Tasks: Theme Color Scale

**Input**: Design documents from `/specs/001-add-theme-colors/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/theme-color-tokens.md`, `quickstart.md`

**Tests**: No explicit TDD or automated test requirement was requested in the specification. This task list focuses on implementation plus lint/build and manual validation checks.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature scope and prepare shared token contract references before code edits.

- [ ] T001 Review token requirements and semantic mapping in specs/001-add-theme-colors/contracts/theme-color-tokens.md
- [ ] T002 Review current Tailwind v4 token setup in web/src/index.css and document insertion points in specs/001-add-theme-colors/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add global `theme` color family into the base Tailwind token system used by all UI.

**CRITICAL**: No user-story implementation should start before this phase is complete.

- [ ] T003 Add `--theme-50` through `--theme-950` light-mode CSS variables in web/src/index.css under `:root`
- [ ] T004 Add `--theme-50` through `--theme-950` dark-mode CSS variables in web/src/index.css under `.dark`
- [ ] T005 Map `--color-theme-50` through `--color-theme-950` in `@theme inline` in web/src/index.css
- [ ] T006 [P] Add semantic usage guidance comments for high/medium/low emphasis theme shades in web/src/index.css
- [ ] T007 [P] Verify contract alignment for token namespace and steps in specs/001-add-theme-colors/contracts/theme-color-tokens.md

**Checkpoint**: Global `theme` token family is available to Tailwind utilities across the app.

---

## Phase 3: User Story 1 - Use Theme Color in Core UI (Priority: P1) 🎯 MVP

**Goal**: Make `theme` colors usable in core UI paths and confirm token rendering for primary and supporting elements.

**Independent Test**: Update representative UI elements to use `theme` classes and verify visible darker-to-lighter sky-blue rendering.

### Implementation for User Story 1

- [ ] T008 [US1] Apply `theme` classes to one primary-action surface in web/src/pages/home.tsx
- [ ] T009 [US1] Apply `theme` classes to one supporting UI element (text, border, or surface) in web/src/components/layout/Topbar.tsx
- [ ] T010 [US1] Ensure representative ShadCN component usage reflects token availability in web/src/components/ui/button.tsx
- [ ] T011 [US1] Validate that `bg-theme-*`, `text-theme-*`, and `border-theme-*` compile and render via manual checks in specs/001-add-theme-colors/quickstart.md

**Checkpoint**: US1 is complete when the new `theme` family is visibly usable in representative production UI.

---

## Phase 4: User Story 2 - Keep UI Theming Consistent (Priority: P2)

**Goal**: Provide predictable token usage and migration guidance so developers apply `theme` consistently.

**Independent Test**: Confirm developers can map high/medium/low emphasis to repeatable `theme` shades without one-off color values.

### Implementation for User Story 2

- [ ] T012 [US2] Add explicit role-to-shade mapping guidance in specs/001-add-theme-colors/contracts/theme-color-tokens.md
- [ ] T013 [US2] Add migration notes for replacing legacy sky-blue usage with `theme` tokens in specs/001-add-theme-colors/quickstart.md
- [ ] T014 [P] [US2] Align planning notes with final migration guidance in specs/001-add-theme-colors/plan.md
- [ ] T015 [US2] Review representative UI files for ad-hoc sky-blue literals and replace with `theme` token classes in web/src/pages/home.tsx

**Checkpoint**: US2 is complete when token usage is documented and consistent in representative code.

---

## Phase 5: User Story 3 - Support Accessible Visual States (Priority: P3)

**Goal**: Ensure `theme` usage preserves clear interaction states and readable contrast.

**Independent Test**: Verify state transitions and text/icon contrast for representative controls using `theme` tokens.

### Implementation for User Story 3

- [ ] T016 [US3] Define representative state mapping (default/hover/focus/active/disabled) using `theme` shades in specs/001-add-theme-colors/contracts/theme-color-tokens.md
- [ ] T017 [US3] Apply and verify state-specific `theme` classes for one interactive control in web/src/components/ui/button.tsx
- [ ] T018 [US3] Run manual accessibility contrast checks for text/icons on `theme` surfaces and record outcomes in specs/001-add-theme-colors/quickstart.md
- [ ] T019 [P] [US3] Verify focus ring visibility and interactive-state distinction in representative page flow in web/src/pages/home.tsx

**Checkpoint**: US3 is complete when interaction-state clarity and readability checks pass in representative UI.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and handoff readiness across all stories.

- [ ] T020 Run frontend lint and build validation in web/package.json scripts (`npm run lint`, `npm run build`)
- [ ] T021 [P] Confirm quickstart steps and manual checklist are accurate in specs/001-add-theme-colors/quickstart.md
- [ ] T022 [P] Perform final review for scope compliance and no backend impact in specs/001-add-theme-colors/spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Starts after Phase 2.
- **Phase 4 (US2)**: Starts after Phase 2; can run in parallel with late US1 tasks if no file conflict.
- **Phase 5 (US3)**: Starts after Phase 2 and should follow US1 representative control adoption.
- **Phase 6 (Polish)**: Starts after desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: Depends only on foundational token availability.
- **US2 (P2)**: Depends on foundational token availability; references US1 representative usage.
- **US3 (P3)**: Depends on foundational token availability and representative `theme` usage from US1.

### Within Each User Story

- Update token/usage definitions before validation steps.
- Apply representative UI usage before accessibility verification.
- Complete story checkpoint before moving to final polish.

## Parallel Opportunities

- Phase 2: T006 and T007 can run in parallel after T003-T005.
- Phase 4: T014 can run in parallel with T012/T013.
- Phase 5: T019 can run in parallel with T018 after T017 is in place.
- Phase 6: T021 and T022 can run in parallel after T020 starts.

---

## Parallel Example: User Story 1

```bash
# After foundational tokens (T003-T005), run these in parallel on different files:
Task: T009 Apply supporting UI element theme classes in web/src/components/layout/Topbar.tsx
Task: T010 Ensure representative ShadCN component usage in web/src/components/ui/button.tsx
```

## Parallel Example: User Story 2

```bash
# Documentation parallelization for consistency guidance:
Task: T012 Add role-to-shade mapping in specs/001-add-theme-colors/contracts/theme-color-tokens.md
Task: T013 Add migration notes in specs/001-add-theme-colors/quickstart.md
```

## Parallel Example: User Story 3

```bash
# After control state classes are applied (T017), validation can split:
Task: T018 Run and record contrast checks in specs/001-add-theme-colors/quickstart.md
Task: T019 Verify focus/interactive states in web/src/pages/home.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1).
4. Validate representative token rendering.
5. Demo/deploy MVP if acceptable.

### Incremental Delivery

1. Foundation (`theme` tokens globally available).
2. Deliver US1 representative adoption.
3. Deliver US2 consistency and migration guidance.
4. Deliver US3 accessibility and interaction-state validation.
5. Finish with lint/build and documentation polish.

### Parallel Team Strategy

1. One developer handles foundational token definition (`web/src/index.css`).
2. One developer handles representative UI adoption (`home.tsx`, `Topbar.tsx`, `button.tsx`).
3. One developer handles documentation and validation artifacts (`contracts`, `quickstart`, `plan`).

---

## Notes

- `[P]` tasks indicate no blocking dependency and separate file targets.
- Story labels map directly to spec user stories (`US1`, `US2`, `US3`).
- This feature is frontend-only; do not modify backend files.
- Keep token naming and scale strictly aligned with `theme-color-tokens.md`.
