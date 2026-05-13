# Tasks: Group Email Templates and Check-In UX

**Input**: Design documents from `/specs/017-group-email-templates/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests were not explicitly requested in the specification; this task list focuses on implementation and manual validation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared constants and rendering utilities used by multiple stories.

- [x] T001 Create default group template constants in express/src/services/emailTemplates/groupMessageTemplateDefaults.ts
- [x] T002 Create shortcode rendering utility interfaces and helpers in express/src/services/emailTemplates/groupMessageTemplateRenderer.ts
- [x] T003 [P] Add shared frontend template helper text constants for form guidance in web/src/lib/groupTemplatePlaceholders.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Introduce cross-story data contracts required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add service-level type contracts for resolved group templates in express/src/services/groupsService.ts
- [x] T005 Add render context typing for publish email template parsing in express/src/services/groupMeetingsService.ts
- [x] T006 [P] Extend frontend group/meeting API type comments for HTML-compatible template values in web/src/api/types/groups.ts
- [x] T007 [P] Normalize frontend API mapping assumptions for template aliases in web/src/api/groups.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Auto-Seed Group Templates (Priority: P1) 🎯 MVP

**Goal**: Ensure missing group templates are automatically inserted, returned to frontend, and editable in group form.

**Independent Test**: Open a group with missing template fields and verify defaults appear, persist, and can be edited/saved from group form.

### Implementation for User Story 1

- [x] T008 [US1] Add missing-template detection and patch payload builder in express/src/services/groupsService.ts
- [x] T009 [US1] Add targeted partial update support for template-default backfill in express/src/models/groups.ts
- [x] T010 [US1] Apply default-template backfill in editable group read flow in express/src/services/groupsService.ts
- [x] T011 [US1] Apply default-template backfill in groups/mine query mapping flow in express/src/services/groupsService.ts
- [x] T012 [US1] Verify group router responses continue exposing template fields through existing publicMessage/attendanceMessage mapping in express/src/routers/groupsRouter.ts
- [x] T013 [US1] Replace invitation message textarea with rich text editor in web/src/components/forms/GroupForm.tsx
- [x] T014 [US1] Replace attendance message textarea with rich text editor in web/src/components/forms/GroupForm.tsx
- [x] T015 [US1] Update group form hook to support rich text value updates for both template fields in web/src/hooks/useGroupForm.ts
- [x] T016 [US1] Add group template placeholder helper copy using shared constants in web/src/components/forms/GroupForm.tsx

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Inherit and Edit Meeting Templates (Priority: P2)

**Goal**: Preserve group-to-meeting template inheritance and make meeting template fields rich text editable with autosave.

**Independent Test**: Create a meeting from group defaults, confirm inherited template values, edit them in meeting form, and verify group template remains unchanged.

### Implementation for User Story 2

- [x] T017 [US2] Ensure create-next-meeting flow always inherits group publish and attendance template defaults in express/src/services/groupMeetingsService.ts
- [x] T018 [US2] Ensure meeting create normalization preserves HTML-compatible template content in express/src/models/groupMeetings.ts
- [x] T019 [US2] Ensure meeting update normalization preserves HTML-compatible template content in express/src/models/groupMeetings.ts
- [x] T020 [US2] Replace publish email message textarea with rich text editor in web/src/components/forms/MeetingForm.tsx
- [x] T021 [US2] Replace attendance email message textarea with rich text editor in web/src/components/forms/MeetingForm.tsx
- [x] T022 [US2] Extend meeting form props to handle rich text updates for template fields in web/src/components/forms/MeetingForm.tsx
- [x] T023 [US2] Add publishEmailMessage and attendanceEmailMessage rich text change handlers in web/src/hooks/useMeetingForm.ts
- [x] T024 [US2] Ensure meeting autosave payload builder and dirty-check logic still work with rich text template fields in web/src/hooks/useMeetingForm.ts

**Checkpoint**: User Stories 1 and 2 are independently functional.

---

## Phase 5: User Story 3 - Render Parsed Email with Check-In Button (Priority: P3)

**Goal**: Parse publish templates at send time, inject themed check-in button, and expose meeting-details check-in UI matching meeting card behavior.

**Independent Test**: Send/preview a publish email using shortcode template and verify resolved content + button URL; verify meeting details page check-in controls behave like meeting card controls.

### Implementation for User Story 3

- [x] T025 [US3] Add shortcode token replacement pipeline for publish templates in express/src/services/emailTemplates/groupMeetingPublish.ts
- [x] T026 [US3] Add `[meetingDate]`, `[meetingTime]`, and `[dateOfNotification]` formatter helpers for render context in express/src/services/emailTemplates/groupMeetingPublish.ts
- [x] T027 [US3] Add `[checkinButton]` HTML replacement using themed email button component in express/src/services/emailTemplates/groupMeetingPublish.ts
- [x] T028 [US3] Add plain-text fallback rendering for `[checkinButton]` link in express/src/services/emailTemplates/groupMeetingPublish.ts
- [x] T029 [US3] Pass meeting address and meeting URL context into publish email builder in express/src/services/groupMeetingsService.ts
- [x] T030 [US3] Add/extend email template builder input type to include meetingAddress and meetingUrl in express/src/services/emailTemplates/groupMeetingPublish.ts
- [x] T031 [US3] Add meeting details page check-in action section following meeting card state semantics in web/src/pages/group-meeting-view.tsx
- [x] T032 [US3] Reuse existing check-in mutation workflow for details page action handlers in web/src/pages/group-meeting-view.tsx
- [x] T033 [US3] Ensure details page query refresh reflects updated check-in state and counts after mutation in web/src/queries/useMeetingViewQuery.ts

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final pass across stories, docs, and validation.

- [x] T034 [P] Update feature docs with supported shortcodes and default template behavior in specs/017-group-email-templates/quickstart.md
- [x] T035 Run backend compile validation for feature changes in express/package.json using command `cd express && npm run build`
- [x] T036 Run frontend typecheck validation for feature changes in web/tsconfig.app.json using command `cd web && npx tsc --noEmit`
- [ ] T037 Execute manual end-to-end validation checklist and capture outcomes in specs/017-group-email-templates/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story Phases (Phase 3-5)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on US2 or US3.
- **US2 (P2)**: Starts after Phase 2; depends functionally on US1 defaults being available for best UX, but remains independently testable with seeded group values.
- **US3 (P3)**: Starts after Phase 2; can be implemented independently with existing meeting records containing template text.

### Within Each User Story

- Backend data handling tasks precede frontend form/UI tasks.
- Template rendering tasks precede publish-flow integration tasks.
- Meeting details check-in actions follow existing mutation and query wiring.

### Parallel Opportunities

- T003 can run in parallel with T001-T002.
- T006-T007 can run in parallel with T004-T005.
- In US1, T013-T015 can run in parallel after T010-T011 are stable.
- In US2, T020-T021 can run in parallel, then T022-T024.
- In US3, T025-T028 can run in parallel, then T029-T030 and T031-T033.
- T034 can run in parallel with T035-T036.

---

## Parallel Example: User Story 1

```bash
# Backend defaults in parallel (different files)
Task: "Add missing-template detection and patch payload builder in express/src/services/groupsService.ts"
Task: "Add targeted partial update support for template-default backfill in express/src/models/groups.ts"

# Frontend rich text conversion in parallel after backend default flow is stable
Task: "Replace invitation message textarea with rich text editor in web/src/components/forms/GroupForm.tsx"
Task: "Replace attendance message textarea with rich text editor in web/src/components/forms/GroupForm.tsx"
```

## Parallel Example: User Story 2

```bash
# Meeting form UI conversion in parallel
Task: "Replace publish email message textarea with rich text editor in web/src/components/forms/MeetingForm.tsx"
Task: "Replace attendance email message textarea with rich text editor in web/src/components/forms/MeetingForm.tsx"
```

## Parallel Example: User Story 3

```bash
# Publish renderer tasks in parallel
Task: "Add shortcode token replacement pipeline for publish templates in express/src/services/emailTemplates/groupMeetingPublish.ts"
Task: "Add [checkinButton] HTML replacement using themed email button component in express/src/services/emailTemplates/groupMeetingPublish.ts"

# Meeting details UI tasks in parallel
Task: "Add meeting details page check-in action section following meeting card state semantics in web/src/pages/group-meeting-view.tsx"
Task: "Ensure details page query refresh reflects updated check-in state and counts after mutation in web/src/queries/useMeetingViewQuery.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate default backfill and group rich text editing behavior.
4. Demo/deploy MVP if accepted.

### Incremental Delivery

1. Deliver US1 (default seeding + group rich text forms).
2. Deliver US2 (meeting inheritance + meeting rich text forms).
3. Deliver US3 (email shortcode rendering + check-in CTA + details check-in UI).
4. Run compile/typecheck/manual validation and finalize docs.

### Parallel Team Strategy

1. One backend developer handles defaulting + email render pipeline.
2. One frontend developer handles group/meeting rich text form conversion.
3. One frontend developer handles meeting details check-in UI alignment.
4. Sync on shared API shape changes before final polish.

---

## Notes

- All tasks follow strict checklist format with task ID and file path.
- [P] is used only where work can proceed independently.
- Story labels are used only for user story phases.
- Validation commands are kept in polish phase to confirm implementation readiness.
