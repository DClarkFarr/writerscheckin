# Data Model: Control Check-In Period

## Entity: Group (existing, extended)

Represents reusable defaults for meetings in a writing group.

### Fields

- `name: string`
- `description: string`
- `startTime: { hours: number; minutes: number }`
- `durationMinutes: number`
- `publishHoursBefore: number`
- `notifyAttendanceHoursBefore: number`
- `endCheckinHoursBefore: number` (new)

### Validation Rules

- `endCheckinHoursBefore` must be a finite non-negative integer.
- Group create/update requests with invalid values are rejected.

### Notes

- Group-level `endCheckinHoursBefore` is the source default used when creating meetings.

---

## Entity: GroupMeeting (existing, extended)

Represents a concrete scheduled meeting that stores inherited defaults at creation.

### Fields

- `groupId: ObjectId`
- `occursAt: Date`
- `status: "draft" | "published" | "cancelled"`
- `publishHoursBefore: number`
- `notifyAttendanceHoursBefore: number`
- `endCheckinHoursBefore: number` (new, inherited)

### Validation Rules

- `endCheckinHoursBefore` must be a finite non-negative integer.
- Meeting write operations reject invalid updates to this field.

### Inheritance Rule

- On meeting creation from group defaults, copy group `endCheckinHoursBefore` into meeting.
- Existing meetings keep their already stored inherited value when group defaults later change.

---

## Derived Model: Check-In Window

No new collection; derived at runtime.

### Inputs

- `meeting.occursAt`
- `meeting.endCheckinHoursBefore`
- `now`

### Derived Values

- `checkinClosesAt = occursAt - endCheckinHoursBefore hours`
- `isCheckinClosedByCutoff = now >= checkinClosesAt`
- `canCheckin = meeting.status === "published" && now < occursAt && !isCheckinClosedByCutoff`

### Display Model

For each check-in action surface:

- `checkinClosesAt` (ISO)
- `checkinWindowMessage` (relative same-day or absolute different-day)
- `checkinDisabledReason` (cutoff ended / other state)

---

## State Transitions

### Check-In Eligibility

1. `Upcoming + Published + BeforeCutoff` -> Check-in enabled.
2. `Upcoming + Published + AfterCutoff` -> Check-in disabled due to cutoff.
3. `Ongoing/Past/Cancelled/Draft` -> Check-in disabled due to meeting state.

### Check-In Write Path

- Transition attempt while `AfterCutoff` must fail with conflict-style error response.
- Transition attempt while `BeforeCutoff` proceeds with existing attendee state updates.
