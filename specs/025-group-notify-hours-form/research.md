# Research: Group Notify Hours Before Form Field

**Branch**: `025-group-notify-hours-form`  
**Phase**: 0 — Research

## Decisions

### Decision 1: Backend gap scope

- **Decision**: The `notifyAttendanceHoursBefore` field already exists on the `GroupDocument` MongoDB model, is already stored via `updateGroupById`, and is already passed to `createGroupMeeting` when creating meetings from defaults. The gap is only in the form/API layer.
- **Rationale**: `express/src/models/groups.ts` defines `notifyAttendanceHoursBefore: number` on the group definition and has update support. `createNextUpcomingMeetingFromGroupDefaults` (groupMeetingsService.ts:970) already passes `group.notifyAttendanceHoursBefore` to the meeting.
- **Alternatives considered**: None — field already exists end-to-end in the data layer.

### Decision 2: Missing backend wiring

- **Decision**: Three backend wiring gaps must be fixed:
  1. `GroupFormPayload` (groupsService.ts) is missing `notifyAttendanceHoursBefore?: number`.
  2. `createManagedGroup` hardcodes `DEFAULT_ATTENDANCE_HOURS_BEFORE` (= 2) instead of reading from the input payload.
  3. `updateManagedGroup` does not include `notifyAttendanceHoursBefore` in the `updateGroupById` call.
  4. `getManagedGroupForm` does not include `notifyAttendanceHoursBefore` in the returned `EditableGroupFormResult`.
  5. `EditableGroupFormResult` interface is missing `notifyAttendanceHoursBefore: number`.
  6. Router POST `/` and PATCH `/:groupId` do not extract `notifyAttendanceHoursBefore` from `req.body`.
- **Rationale**: Confirmed by code inspection. The PATCH `/:groupId/meetings/:meetingId/edit` handler (lines 665-667) already handles `notifyAttendanceHoursBefore` for meeting-level updates — this is meeting autosave, not group save.
- **Alternatives considered**: None — straightforward wiring fix.

### Decision 3: Missing frontend wiring

- **Decision**: The following frontend gaps must be fixed:
  1. `EditableGroupResponse` (api/types/groups.ts) missing `notifyAttendanceHoursBefore: number`.
  2. `GroupFormDraft` (api/types/groups.ts) missing `notifyAttendanceHoursBefore: number`.
  3. `normalizeEditableGroupResponse` (api/groups.ts) missing `notifyAttendanceHoursBefore: data.notifyAttendanceHoursBefore ?? 2`.
  4. `useGroupForm.ts` missing field, validation, and payload inclusion.
  5. `GroupForm.tsx` missing the input and needs layout restructure.
- **Rationale**: Confirmed by code inspection. The `createGroup` and `updateGroup` API functions send the entire `GroupFormDraft` object as the POST/PATCH body, so adding the field to the type and the hook payload is sufficient.
- **Alternatives considered**: None.

### Decision 4: Form layout restructuring

- **Decision**: The current 3-column scheduling row (`md:flex-row gap-4` with `FieldGroup` containing startTime, durationMinutes, endCheckinHoursBefore) will be replaced by two separate 2-column rows:
  - Row 1 (existing `md:flex-row gap-4`): startTime + durationMinutes
  - Row 2 (new `md:flex-row gap-4`): endCheckinHoursBefore + notifyAttendanceHoursBefore
- **Rationale**: The user explicitly requested this layout. Two 2-column rows follow the existing `md:flex-row gap-4` pattern already used in the form.
- **Alternatives considered**: Single 4-column row — rejected (too cramped on narrow viewports).

### Decision 5: Default value for notifyAttendanceHoursBefore in the group form

- **Decision**: Default `notifyAttendanceHoursBefore` in `DEFAULT_FIELDS` will be `"2"` (matching `DEFAULT_ATTENDANCE_HOURS_BEFORE` in the backend).
- **Rationale**: Consistency with the existing backend default so that new groups created without this field receive the same value as before.
- **Alternatives considered**: `"24"` — rejected; backend default is 2, not 24.

### Decision 6: Validation

- **Decision**: `notifyAttendanceHoursBefore` will accept integers ≥ 0. Field error: "Notify hours must be 0 or greater." Validation mirrors the `endCheckinHoursBefore` pattern.
- **Rationale**: 0 is a valid value that disables the notification. Negative values are nonsensical.
- **Alternatives considered**: Range cap (e.g., max 72h) — not strictly necessary; omitted to match existing uncapped `endCheckinHoursBefore` pattern.
