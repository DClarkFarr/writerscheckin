# Tasks: Group Notify Hours Before Form Field

**Input**: Design documents from `specs/025-group-notify-hours-form/`
**Feature branch**: `025-group-notify-hours-form`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[US1]** / **[US2]**: User story label from spec.md

---

## Phase 1: Setup

**Purpose**: Confirm baseline before changes begin. No new files are created — all changes are additive edits to existing files.

- [x] T001 Verify TypeScript compiles cleanly before any edits: run `npx tsc --noEmit` in both `express/` and `web/` and confirm zero errors

---

## Phase 2: Foundational — Backend Wiring

**Purpose**: Expose `notifyAttendanceHoursBefore` through the group form API layer. These changes MUST be complete before any frontend work (US1/US2) can function end-to-end.

**⚠️ CRITICAL**: US1 and US2 both depend on this phase being complete.

- [x] T002 Add `notifyAttendanceHoursBefore?: number` to `GroupFormPayload` interface and `notifyAttendanceHoursBefore: number` to `EditableGroupFormResult` interface in `express/src/services/groupsService.ts`
- [x] T003 Update `createManagedGroup` in `express/src/services/groupsService.ts` to use `input.notifyAttendanceHoursBefore ?? DEFAULT_ATTENDANCE_HOURS_BEFORE` instead of the hardcoded `DEFAULT_ATTENDANCE_HOURS_BEFORE` (depends on T002)
- [x] T004 Update `updateManagedGroup` in `express/src/services/groupsService.ts` to conditionally include `notifyAttendanceHoursBefore` in the `updateGroupById` call, mirroring the existing `endCheckinHoursBefore` pattern (depends on T002)
- [x] T005 Update `getManagedGroupForm` in `express/src/services/groupsService.ts` to include `notifyAttendanceHoursBefore: group.notifyAttendanceHoursBefore ?? DEFAULT_ATTENDANCE_HOURS_BEFORE` in the return object (depends on T002)
- [x] T006 [P] Add `notifyAttendanceHoursBefore: req.body?.notifyAttendanceHoursBefore` to both the POST `/` handler (`createManagedGroup` call) and the PATCH `/:groupId` handler (`updateManagedGroup` call) in `express/src/routers/groupsRouter.ts`

**Checkpoint**: Backend now reads, stores, and returns `notifyAttendanceHoursBefore` via the group form API. Verifiable by calling `GET /api/groups/:groupId` and checking the response includes the field.

---

## Phase 3: User Story 1 — Group Form Field & Layout (Priority: P1) 🎯 MVP

**Goal**: Group owners can see and update "Notify Attendance Hours Before" in the group settings form, and new meetings inherit the value.

**Independent Test**: Open the group edit page, change "Notify Attendance Hours Before", save, create a new meeting from defaults, confirm the meeting's `notifyAttendanceHoursBefore` matches.

- [x] T007 [P] [US1] Add `notifyAttendanceHoursBefore: number` to `GroupFormDraft` interface and `EditableGroupResponse` interface in `web/src/api/types/groups.ts`
- [x] T008 [P] [US1] Add `notifyAttendanceHoursBefore: data.notifyAttendanceHoursBefore ?? 2` to `normalizeEditableGroupResponse` in `web/src/api/groups.ts`
- [x] T009 [US1] Update `web/src/hooks/useGroupForm.ts`: add `notifyAttendanceHoursBefore: string` to `Fields` type; add `"notifyAttendanceHoursBefore"` to `GroupFormInitialValues` Pick; set `notifyAttendanceHoursBefore: "2"` in `DEFAULT_FIELDS`; initialize field state from `options.existingGroup?.notifyAttendanceHoursBefore`; add validation case in `validateField` (required, `>= 0`); add to `validateAll`; add `notifyAttendanceHoursBefore: Number.parseInt(fields.notifyAttendanceHoursBefore, 10)` to `handleSubmit` payload (depends on T007)
- [x] T010 [US1] Update `web/src/components/forms/GroupForm.tsx`: split the existing 3-column `md:flex-row` scheduling `FieldGroup` into two separate 2-column `md:flex-row` `FieldGroup` rows — Row 1: startTime + durationMinutes; Row 2: endCheckinHoursBefore + new `notifyAttendanceHoursBefore` input (depends on T009)

**Checkpoint**: User Story 1 fully functional. Group owner can set the field, save, and new meetings inherit the value. US2 (existing group pre-population) is also covered — `EditableGroupResponse` carries the stored value, `normalizeEditableGroupResponse` normalizes it, and `useGroupForm` initializes the field from `options.existingGroup?.notifyAttendanceHoursBefore`.

---

## Phase 4: User Story 2 — Existing Groups Retain Value (Priority: P2)

**Goal**: Confirm existing groups pre-populate the field correctly with no data loss on re-save.

**Independent Test**: Open an existing group form, verify field shows current stored value, save without changing it, reload — value unchanged.

> **Note**: US2 is fully covered by T007–T010. No additional implementation tasks are required. This phase is a verification checkpoint only.

**Checkpoint**: Open any existing group's edit form and confirm `notifyAttendanceHoursBefore` is pre-populated with the group's current stored value.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T011 [P] Run `npx tsc --noEmit` in `express/` and confirm zero TypeScript errors
- [x] T012 [P] Run `npx tsc --noEmit` in `web/` and confirm zero TypeScript errors

---

## Dependencies

```
T001
  └── T002
        ├── T003
        ├── T004
        └── T005
T006 (parallel with T002–T005, different file)
T007 (parallel with T008, different files)
T008
T007 → T009 → T010
T010 → T011, T012
```

## Parallel Execution Examples

**US1 batch (after T002 is done)**:

- T003, T004, T005 can be applied in one multi-replace pass on `groupsService.ts`
- T006 is independent (different file: `groupsRouter.ts`)
- T007 and T008 are independent (different files)

**Final validation**:

- T011 and T012 run in parallel (different projects)

## Implementation Strategy

**MVP scope** = Phase 2 + Phase 3 (T002–T010). This delivers the full feature.

Suggested order for a single-session implementation:

1. T001 — baseline tsc check
2. T002 → T003+T004+T005 (all in `groupsService.ts`) + T006 (`groupsRouter.ts`) in parallel
3. T007+T008 in parallel (frontend types + normalization)
4. T009 (hook)
5. T010 (component)
6. T011+T012 in parallel (final tsc check)
