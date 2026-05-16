# Data Model: Meeting Check-in Timing

**Phase**: 1 (Design & Contracts)  
**Date**: May 16, 2026  
**Status**: Complete

## Entity: GroupMeeting (Updated)

### New Fields

```typescript
interface GroupMeetingDefinition extends BaseModelBlueprint {
  // ...existing fields...
  startCheckinHoursAfterCreation: number; // NEW: Hours after meeting creation when check-in opens (default 0)
  endCheckinHoursBefore: number; // EXISTING: Hours before occursAt when check-in closes
  occursAt: Date; // EXISTING: When the meeting occurs
  createdAt: Date; // EXISTING: When meeting was created
}
```

### Field Details

| Field                            | Type          | Required | Default | Notes                                                                                                                   |
| -------------------------------- | ------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `startCheckinHoursAfterCreation` | Number        | Yes      | `0`     | Must be ≥ 0. If 0, check-in available immediately upon creation. If 48, check-in opens 48 hours after meeting creation. |
| `endCheckinHoursBefore`          | Number        | Yes      | `0`     | Must be ≥ 0. If 0, check-in available until occursAt. If 2, check-in closes 2 hours before the meeting.                 |
| `occursAt`                       | ISO 8601 Date | Yes      | N/A     | Meeting occurrence time. Check-in closes at `occursAt - (endCheckinHoursBefore * 3600 * 1000)` ms.                      |
| `createdAt`                      | ISO 8601 Date | Yes      | now()   | Meeting creation time. Check-in opens at `createdAt + (startCheckinHoursAfterCreation * 3600 * 1000)` ms.               |

### Validation Rules

1. **Non-negative hours**: `startCheckinHoursAfterCreation ≥ 0` and `endCheckinHoursBefore ≥ 0`
2. **Logical window**: Check-in start must be before check-in end:
   ```
   createdAt + (startCheckinHoursAfterCreation * 3600s)
   <
   occursAt - (endCheckinHoursBefore * 3600s)
   ```
3. **Future occursAt**: `occursAt > now()` (meetings cannot occur in the past)

### State Transitions

```
Meeting creation: groupId, name, occursAt, startCheckinHoursAfterCreation, endCheckinHoursBefore
         ↓
Meeting stored with createdAt timestamp
         ↓
Check-in becomes available at: createdAt + (startCheckinHoursAfterCreation hours)
         ↓
Check-in closes at: occursAt - (endCheckinHoursBefore hours)
         ↓
After close, attendees can only downgrade status (admin can upgrade)
```

---

## Entity: MeetingAttendee (Updated)

### New Fields

```typescript
interface MeetingAttendeeDefinition extends BaseModelBlueprint {
  meetingId: ObjectId;
  memberId: ObjectId;
  status: "invited" | "reading" | "attending" | "skipping"; // EXISTING
  changedBy?: ObjectId; // NEW: User ID of who last changed this status (attendee, admin, or system)
  isAdminOverride?: boolean; // NEW: True if last change was by group admin; false if by attendee
  updatedAt: Date; // EXISTING: When status was last updated
}
```

### Field Details

| Field             | Type     | Required | Default | Notes                                                                                                                       |
| ----------------- | -------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `changedBy`       | ObjectId | No       | null    | References `users._id`. Records who last changed the status. Helps distinguish attendee self-check-in from admin overrides. |
| `isAdminOverride` | Boolean  | No       | false   | True if `changedBy` is a group admin and the change was an upgrade. Helps track intent and history.                         |

### Validation Rules

1. **Status transitions**: Must follow one of these paths:
   - `invited` → `reading`, `attending`, or `skipping` (initial check-in during open window)
   - `reading` → `attending` or `skipping` (downgrade when window closed)
   - `attending` → `skipping` (downgrade when window closed)
   - Any → Any (admin upgrade, anytime, regardless of window state)

2. **Downgrade enforcement** (attendee):
   - If check-in window is open: Block all status changes
   - If check-in window is closed: Allow only downgrades (move left in hierarchy `reading > attending > skipping`)

3. **Admin authorization**:
   - `changedBy` user must be in `groupMembers` with `role: "admin"` for the meeting's group
   - Admin can upgrade from any status to any higher status regardless of window state

### Historical Tracking

Audit trail is already maintained via `meetingAttendanceLogs` collection. Each status change records:

- `attendeeId` (the attendee whose status changed)
- `oldStatus` and `newStatus`
- `changedAt` timestamp
- `changedBy` user ID (redundant with `meetingAttendees.changedBy` for latest; log preserves full history)

---

## Entity: MeetingCheckinWindowState (Derived)

Represents current temporal state of a meeting's check-in window for a specific user session.

### Calculation Logic

```typescript
interface CheckinWindowState {
  isOpen: boolean; // true if currentTime is in [checkinStart, checkinEnd)
  notStarted: boolean; // true if currentTime < checkinStart
  closed: boolean; // true if currentTime >= checkinEnd
  remainingMs?: number; // If open, ms until close; else null
  startsInMs?: number; // If not started, ms until opens; else null
}

function calculateCheckinWindow(
  meeting: GroupMeetingDocument,
): CheckinWindowState {
  const now = Date.now();
  const checkinStart =
    meeting.createdAt.getTime() +
    meeting.startCheckinHoursAfterCreation * 3600 * 1000;
  const checkinEnd =
    meeting.occursAt.getTime() - meeting.endCheckinHoursBefore * 3600 * 1000;

  if (now < checkinStart) {
    return {
      isOpen: false,
      notStarted: true,
      closed: false,
      startsInMs: checkinStart - now,
    };
  }

  if (now >= checkinEnd) {
    return {
      isOpen: false,
      notStarted: false,
      closed: true,
    };
  }

  // In the open window
  return {
    isOpen: true,
    notStarted: false,
    closed: false,
    remainingMs: checkinEnd - now,
  };
}
```

### Validation Rules

- `checkinStart <= checkinEnd` (logically valid window)
- `isOpen` is true only when `now >= checkinStart` and `now < checkinEnd`
- `isClosed` is true when `now >= checkinEnd`
- Same-day date matching with `occursAt` is **NOT** part of eligibility

---

## Entity: CheckinActionPresentationState (Derived)

UI contract for button label and supporting message in feed/detail check-in controls.

### Fields

```typescript
interface CheckinActionPresentationState {
  buttonLabel: string; // "Check-in starts soon", "Check in", or "Status"
  buttonDisabled: boolean; // True if window not open or user lacks permission
  supportingMessage: string; // Dynamic countdown or static message
  showLiveCountdown: boolean; // True only when window is open
  disabledReason?: string; // "Check-in has not yet started" or "Period has closed; contact admin to change status"
  userCanDowngrade: boolean; // True if window closed and user can downgrade
  userCanAdminUpgrade: boolean; // True if user is group admin
}
```

### Validation Rules

- Before open window: `buttonLabel` is static `Check-in starts soon`; `buttonDisabled: true`
- Countdown values MUST NOT be included in `buttonLabel`
- Countdown values MAY appear only in `supportingMessage` (updates every second when open)
- During open window: `buttonLabel` is `Check in`; `buttonDisabled: false`; `showLiveCountdown: true`
- After closed window: `buttonLabel` is `Status`; `buttonDisabled` depends on user role
- If user can downgrade: `buttonDisabled: false`; if user is admin: show admin upgrade UI
- If user cannot change: `buttonDisabled: true`; `disabledReason` explains why

---

## Entity: StatusChangeAuthorization (Business Rules)

### Status Hierarchy

```typescript
type StatusHierarchy = "reading" | "attending" | "skipping";
const HIERARCHY_RANK: Record<StatusHierarchy, number> = {
  reading: 3, // Highest commitment
  attending: 2, // Medium commitment
  skipping: 1, // Lowest commitment
};
```

### Status Change Rules by Context

```typescript
interface StatusChangeRequest {
  currentStatus: StatusHierarchy;
  desiredStatus: StatusHierarchy;
  checkinWindowState: CheckinWindowState;
  changeContext: "attendee" | "admin";
  isGroupAdmin?: boolean; // Required if changeContext = "admin"
}

function isStatusChangeAllowed(request: StatusChangeRequest): boolean {
  const currentRank = HIERARCHY_RANK[request.currentStatus];
  const desiredRank = HIERARCHY_RANK[request.desiredStatus];
  const isDowngrade = desiredRank < currentRank;
  const isUpgrade = desiredRank > currentRank;
  const isSameStatus = currentRank === desiredRank;

  // Admin can always upgrade (and downgrade is blocked for admin by spec)
  if (request.changeContext === "admin" && request.isGroupAdmin) {
    // Admin can upgrade anytime, regardless of window state
    return isUpgrade || isSameStatus; // Allow upgrade or no-op; reject downgrade
  }

  // Attendee (non-admin)
  if (request.changeContext === "attendee") {
    // If window is open, all changes blocked
    if (request.checkinWindowState.isOpen) {
      return false;
    }

    // If window not yet opened, no changes allowed
    if (request.checkinWindowState.notStarted) {
      return false;
    }

    // If window is closed, only downgrades allowed
    if (request.checkinWindowState.closed) {
      return isDowngrade || isSameStatus; // Allow downgrade or no-op; reject upgrade
    }
  }

  return false; // Default: deny
}
```

---

## Backend Service Validation Points

### 1. updateMeetingCheckin (Attendee Self-Check-In)

**File**: `express/src/services/meetingCheckinService.ts`

**Changes**:

- Remove day-of-meeting date check: `occursAt < nowMs`
- Add timestamp boundary checks:

  ```typescript
  const checkinStart =
    meeting.createdAt.getTime() +
    meeting.startCheckinHoursAfterCreation * 3600 * 1000;
  const checkinEnd =
    meeting.occursAt.getTime() - meeting.endCheckinHoursBefore * 3600 * 1000;

  if (nowMs < checkinStart)
    throw AuthError("Check-in has not yet started", 409);
  if (nowMs >= checkinEnd) throw AuthError("Check-in period has ended", 409);
  ```

- Block status changes while window open (first check-in is exempt as initial state is "invited"):
  ```typescript
  if (existing && existing.status !== "invited") {
    throw AuthError("Cannot change status while check-in period is open", 409);
  }
  ```

### 2. adminUpgradeMeetingAttendeeStatus (New Function)

**File**: `express/src/services/meetingCheckinService.ts`

**Signature**:

```typescript
export async function adminUpgradeMeetingAttendeeStatus(
  meetingId: string | ObjectId,
  attendeeId: string | ObjectId,
  targetStatus: AttendanceStatus,
  adminUserId: string | ObjectId,
): Promise<MeetingAttendeeDocument>;
```

**Validation**:

1. Meeting exists and belongs to group
2. Admin user is in `groupMembers` with `role: "admin"` for that group
3. Attendee exists in meeting
4. Target status is higher than current status (upgrade only)
5. No window state check (admin bypasses window)

**Result**: Updates `meetingAttendees.status`, `meetingAttendees.changedBy`, `meetingAttendees.isAdminOverride = true`

---

## Frontend Hook Dependencies

### New Hooks

#### `useCheckinWindowState(meeting: Meeting | null)`

**Returns**:

```typescript
{
  windowState: "not_started" | "open" | "closed";
  remainingTime: string | null; // e.g. "2h 15m 30s"
  remainingMs: number | null; // raw milliseconds
  isLive: boolean; // true if timer is running
}
```

**Behavior**:

- When window is open, starts `setInterval(1000)` to update remaining time
- Stops interval when closed or unmounted
- Pre-computes remainingTime string using dayjs duration plugin

#### `useMeetingAdminStatus(meeting: Meeting, session: AuthSession | null)`

**Returns**:

```typescript
{
  isGroupAdmin: boolean; // true if user is admin of meeting's group
  canAdminUpgrade: boolean; // convenience flag
}
```

**Behavior**:

- Checks if `session.userId` is in `groupMembers` with `role: "admin"` for `meeting.groupId`
- Memoized to avoid recalculating on every render

#### `useStatusChangeValidation(currentStatus: AttendanceStatus, windowState: CheckinWindowState, isAdmin: boolean)`

**Returns**:

```typescript
{
  allowedTransitions: AttendanceStatus[];  // ["attending", "skipping"] if downgrade-only
  isAllowed(targetStatus: AttendanceStatus): boolean;
  disabledReason?: string;  // "Check-in period is still open" if blocked
}
```

---

## Database Index Updates

### MeetingAttendees Collection

**Existing**:

```javascript
{ meetingId: 1, memberId: 1 } // unique
```

**New indices (optional, for performance)**:

```javascript
// Find all attendees in a meeting with a specific status
{ meetingId: 1, status: 1 }

// Find who made the last change (for admin oversight)
{ meetingId: 1, changedBy: 1 }

// Audit trail: find admin overrides
{ meetingId: 1, isAdminOverride: 1 }
```

---

## Constraints & Guarantees

1. **Atomicity**: MongoDB atomic update ensures last write wins for concurrent status changes
2. **Audit Trail**: `meetingAttendanceLogs` records full history; `meetingAttendees.changedBy` + `isAdminOverride` enables quick classification
3. **Authorization**: Group admin check performed in service layer (Layer 2); never trust client claims
4. **Window Validation**: Timestamp-based; no calendar date assumptions
5. **Downgrade Semantics**: Only attendee can downgrade; admin can only upgrade; never both on same update

### Fields

- `meetingId: string`
- `groupId: string`
- `membershipStatus: "accepted" | other`
- `occursAt: string`
- `checkinClosesAt: string`
- `canMutate: boolean`
- `rejectReason?: "meeting_not_found" | "forbidden" | "meeting_not_upcoming" | "checkin_closed"`

### Validation Rules

- Membership MUST be accepted
- Meeting MUST still be upcoming according to existing service rule
- `now < checkinClosesAt` required for mutation
- Reject reason maps to existing `AuthError` statuses and messages

---

## State Transitions

### UI check-in window transitions

1. `PreOpen` -> `Open` when `now` reaches `checkinOpensAt`
2. `Open` -> `Closed` when `now` reaches `checkinClosesAt`
3. `Open` retains live countdown and per-second updates until closed

### Action label/message transitions

1. `PreOpen`: button label `Check-in starts soon`, supporting message may include countdown to open
2. `Open`: action buttons enabled per eligibility; supporting message shows `Check-in period ends in ...` (second-level)
3. `Closed`: action buttons disabled; supporting message indicates closed period

---

## Backward Compatibility Notes

- Existing API and socket payload contracts remain additive/compatible.
- `canCheckin` semantics continue to be used; same-day frontend filter is removed.
- Existing mutation error responses remain valid and are reused by UI.
