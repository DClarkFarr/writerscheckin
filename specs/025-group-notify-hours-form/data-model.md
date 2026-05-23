# Data Model: Group Notify Hours Before Form Field

**Branch**: `025-group-notify-hours-form`  
**Phase**: 1 — Design

## Existing Data Shape (No Schema Changes Required)

The `notifyAttendanceHoursBefore` field already exists at all data layers. No MongoDB migrations, new collections, or index changes are needed.

### GroupDocument (already exists — `express/src/models/groups.ts`)

| Field                         | Type     | Notes                                                                                                 |
| ----------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `notifyAttendanceHoursBefore` | `number` | Hours before meeting to send attendance notification email. 0 = disabled. Already stored and indexed. |

### GroupMeetingDocument (already exists — `express/src/models/groupMeetings.ts`)

| Field                         | Type     | Notes                                                          |
| ----------------------------- | -------- | -------------------------------------------------------------- |
| `notifyAttendanceHoursBefore` | `number` | Inherited from group at meeting creation time. Already stored. |

---

## Wiring Gaps (What Changes)

### Backend — Service Layer (`express/src/services/groupsService.ts`)

**`GroupFormPayload` interface** — add field:

```typescript
notifyAttendanceHoursBefore?: number;
```

**`EditableGroupFormResult` interface** — add field:

```typescript
notifyAttendanceHoursBefore: number;
```

**`createManagedGroup`** — change hardcoded default:

```typescript
// Before:
notifyAttendanceHoursBefore: DEFAULT_ATTENDANCE_HOURS_BEFORE,
// After (uses input if provided, falls back to default):
notifyAttendanceHoursBefore:
  typeof input.notifyAttendanceHoursBefore === "number"
    ? input.notifyAttendanceHoursBefore
    : DEFAULT_ATTENDANCE_HOURS_BEFORE,
```

**`updateManagedGroup`** — add conditional update (mirrors `endCheckinHoursBefore` pattern):

```typescript
...(typeof input.notifyAttendanceHoursBefore === "number"
  ? { notifyAttendanceHoursBefore: input.notifyAttendanceHoursBefore }
  : {}),
```

**`getManagedGroupForm`** — add to return object:

```typescript
notifyAttendanceHoursBefore: group.notifyAttendanceHoursBefore ?? DEFAULT_ATTENDANCE_HOURS_BEFORE,
```

### Backend — Router Layer (`express/src/routers/groupsRouter.ts`)

**POST `/` handler** — add field to `createManagedGroup` input:

```typescript
notifyAttendanceHoursBefore: req.body?.notifyAttendanceHoursBefore,
```

**PATCH `/:groupId` handler** — add field to `updateManagedGroup` input:

```typescript
notifyAttendanceHoursBefore: req.body?.notifyAttendanceHoursBefore,
```

### Frontend — API Types (`web/src/api/types/groups.ts`)

**`GroupFormDraft` interface** — add:

```typescript
notifyAttendanceHoursBefore: number;
```

**`EditableGroupResponse` interface** — add:

```typescript
notifyAttendanceHoursBefore: number;
```

### Frontend — API Client (`web/src/api/groups.ts`)

**`normalizeEditableGroupResponse`** — add normalization:

```typescript
notifyAttendanceHoursBefore: data.notifyAttendanceHoursBefore ?? 2,
```

### Frontend — Hook (`web/src/hooks/useGroupForm.ts`)

**`Fields` type** — add:

```typescript
notifyAttendanceHoursBefore: string;
```

**`GroupFormInitialValues`** — add to the `Pick`:

```typescript
| "notifyAttendanceHoursBefore"
```

**`DEFAULT_FIELDS`** — add:

```typescript
notifyAttendanceHoursBefore: "2",
```

**State initialization** — add field mapping:

```typescript
notifyAttendanceHoursBefore:
  options.existingGroup?.notifyAttendanceHoursBefore !== undefined
    ? String(options.existingGroup.notifyAttendanceHoursBefore)
    : DEFAULT_FIELDS.notifyAttendanceHoursBefore,
```

**`validateField` switch** — add case:

```typescript
case "notifyAttendanceHoursBefore": {
  const hours = Number.parseInt(fields.notifyAttendanceHoursBefore, 10);
  if (Number.isNaN(hours)) return "Notify hours is required.";
  if (hours < 0) return "Notify hours must be 0 or greater.";
  return undefined;
}
```

**`validateAll`** — add field:

```typescript
notifyAttendanceHoursBefore: validateField("notifyAttendanceHoursBefore", fields, recurrenceDaysOfWeek),
```

**`handleSubmit` payload** — add:

```typescript
notifyAttendanceHoursBefore: Number.parseInt(fields.notifyAttendanceHoursBefore, 10),
```

### Frontend — Component (`web/src/components/forms/GroupForm.tsx`)

Layout change from one 3-column `md:flex-row` row to two 2-column `md:flex-row` rows:

```
Before:
  <FieldGroup className="md:flex-row gap-4">
    <Field> startTime </Field>
    <Field> durationMinutes </Field>
    <Field> endCheckinHoursBefore </Field>
  </FieldGroup>

After:
  <FieldGroup className="md:flex-row gap-4">
    <Field> startTime </Field>
    <Field> durationMinutes </Field>
  </FieldGroup>
  <FieldGroup className="md:flex-row gap-4">
    <Field> endCheckinHoursBefore </Field>
    <Field> notifyAttendanceHoursBefore </Field>  ← new input
  </FieldGroup>
```

---

## Validation Rules

| Field                         | Type    | Min | Max | Required |
| ----------------------------- | ------- | --- | --- | -------- |
| `notifyAttendanceHoursBefore` | integer | 0   | —   | Yes      |

---

## State Transitions

No new state machines. Existing group save flow is unchanged; this is additive.
