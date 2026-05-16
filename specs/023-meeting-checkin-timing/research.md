# Research: Meeting Check-in Timing Feature

**Phase**: 0 (Research & Clarification)  
**Status**: Complete  
**Date**: May 16, 2026

## Research Tasks & Findings

### 1. Check-in Window Timing Logic

**Task**: Clarify whether calendar date matching (day-of-meeting requirement) governs check-in eligibility, or if timestamps alone determine eligibility.

**Decision**: Timestamps alone determine eligibility. Calendar date is NOT a factor.

**Rationale**:

- Feature spec explicitly requires: "System MUST NOT require current calendar date to match the meeting date in order to allow check-in."
- Spec defines window as: check-in start time (now - meetingDate or anytime after startCheckinHoursAfterCreation) through check-in end time (meetingDate - endCheckinHoursBefore).
- Edge case coverage confirms: "Client clock continues updating while the feed item stays mounted for long periods; countdown remains accurate and does not freeze. User crosses midnight or local timezone boundaries while viewing the meeting item; availability is still based on the defined check-in window rather than same-day meeting matching."

**Implementation Impact**:

- Remove any day-of-meeting tooltip or validation check
- Validation: `currentTime >= checkinStartTime && currentTime < checkinEndTime` (pure timestamp comparison)
- Backend: `meetingCheckinService.updateMeetingCheckin()` currently checks `occursAt < nowMs` (past-meeting blocker); this remains but is not the day-of-meeting check

**Alternatives Considered**:

- Calendar date matching (REJECTED: contradicts explicit requirements and limits utility for multi-day workshops or early-bird check-ins)

---

### 2. Meeting Check-in Window Configuration

**Task**: Define which fields on the `GroupMeeting` model determine the check-in window start time.

**Decision**: Two fields define the window:

- `startCheckinHoursAfterCreation`: Hours after the meeting is created when check-in becomes available (allows admins to set early/late access)
- `endCheckinHoursBefore`: Hours before `occursAt` when check-in closes

**Rationale**:

- Current implementation already supports `endCheckinHoursBefore`
- `startCheckinHoursAfterCreation` is NEW and complements existing `endCheckinHoursBefore`
- Allows flexible workflows: e.g., "check-in opens 2 days before" or "check-in opens when meeting is announced"
- Matches edge case: "Check-in start occurs on a different calendar day than meeting date because of an extended lead time (for example 48 hours); eligibility still follows check-in start and end timestamps"

**Check-in Window Boundaries**:

```
checkinStartTime = meetingCreatedAt + (startCheckinHoursAfterCreation * 60 * 60 * 1000)
checkinEndTime = meetingOccursAt - (endCheckinHoursBefore * 60 * 60 * 1000)
currentTime: eligible if checkinStartTime <= currentTime < checkinEndTime
```

**Implementation Impact**:

- Add `startCheckinHoursAfterCreation` field to `GroupMeeting` model (default: 0, meaning check-in available immediately upon meeting creation)
- Update `meetingCheckinService` to calculate both boundaries
- Update all eligibility checks to compare against both boundaries

**Alternatives Considered**:

- Fixed 48-hour pre-meeting check-in (REJECTED: insufficient flexibility for different group workflows)
- Check-in start based on admin-set absolute time (REJECTED: harder to predict and configure)

---

### 3. Status Downgrade Logic (Post-Period Closure)

**Task**: Define which status transitions are allowed for attendee self-initiated downgrades after check-in period closes.

**Decision**:

- Downgrade path: `reading` → `attending` OR `reading` → `skipping`; `attending` → `skipping`
- Upgrade path (for attendees): BLOCKED when period is closed
- Upgrade path (for admins): UNRESTRICTED by window state

**Rationale**:

- Feature spec: "After check-in period closes, attendees MUST be able to downgrade their status ('reading' → 'attending'/'skipping', 'attending' → 'skipping') but MUST NOT be able to upgrade."
- Use case: Attendee initially checked in as "reading" but circumstances change; they want to downgrade to "attending" without being locked into "reading"
- Status hierarchy: `reading` (highest commitment) > `attending` (medium) > `skipping` (lowest)

**Status Change Rules**:

| Scenario              | Current Status           | Desired Status                   | Window Open?  | Can Attendee Change? | Can Admin Change? |
| --------------------- | ------------------------ | -------------------------------- | ------------- | -------------------- | ----------------- |
| Initial self-check-in | `invited`                | `reading`/`attending`/`skipping` | Yes (must be) | ✅ Allowed           | N/A               |
| Downgrade after close | `reading`                | `attending`                      | No (closed)   | ✅ Allowed           | ✅ Allowed        |
| Downgrade after close | `attending`              | `skipping`                       | No (closed)   | ✅ Allowed           | ✅ Allowed        |
| Upgrade after close   | `skipping` → `attending` | No (closed)                      | ❌ Blocked    | ✅ Allowed           |
| Upgrade after close   | `attending` → `reading`  | No (closed)                      | ❌ Blocked    | ✅ Allowed           |
| Any change while open | Any                      | Any                              | Yes (open)    | ❌ Blocked\*         | ✅ Allowed        |

\*Current spec: "System MUST prevent status changes while check-in period is open; all status modifications for attendees MUST be blocked until check-in has closed." Admin status changes are unrestricted by window state.

**Implementation Impact**:

- Add helper functions: `isCheckinPeriodOpen()`, `canDowngradeStatus(currentStatus, desiredStatus)`, `canAdminUpgradeStatus(currentStatus, desiredStatus)`
- Update `meetingCheckinService.updateMeetingCheckin()` to enforce attendee restrictions
- Add new service function: `adminUpgradeMeetingAttendeeStatus()` with admin auth check
- Add tracking fields: `changedBy` (userId), `isAdminOverride` (boolean) to `meetingAttendees` model

**Alternatives Considered**:

- Free-form status changes by attendee (REJECTED: loses control; attendees could upgrade and then downgrade, causing confusion)
- Complete lock after period closes (REJECTED: violates requirement for post-close downgrades)

---

### 4. Admin Status Upgrade Capability

**Task**: Define admin authorization model and when admin status upgrades are allowed.

**Decision**:

- Admin = group member with `role: "admin"` in `groupMembers` collection
- Admin can upgrade any attendee's status to any higher level regardless of check-in window state
- Admin CANNOT downgrade (downgrade is attendee-only action)
- Authorization check: Verify `req.session.userId` is in `groupMembers` with `role: "admin"` and `groupId = meeting.groupId`

**Rationale**:

- Feature spec: "Group admins MUST be able to upgrade any attendee's check-in status to any higher level regardless of check-in window state or current attendee status."
- Use case: Attendee cannot check in; admin manually upgrades them to reflect actual attendance
- Admin role is already established in `groupMembers` model per constitution

**Implementation Impact**:

- New service function: `adminUpgradeMeetingAttendeeStatus(meetingId, attendeeId, targetStatus, adminUserId)`
- Authorization check in function: Verify admin is in group and meeting belongs to group
- New router endpoint: `PATCH /api/meetings/:meetingId/attendees/:attendeeId/status` (admin-only)
- Add to `meetingAttendees`: `changedBy` (userId who made change), `isAdminOverride` (true if admin upgrade)

**Alternatives Considered**:

- Global admins (REJECTED: WritersCheckIn is multi-tenant group-scoped; auth must be group-specific)
- Allow admins to downgrade (REJECTED: spec explicitly restricts to upgrades only)

---

### 5. Frontend Countdown Update Frequency

**Task**: Determine implementation strategy for per-second countdown updates without server polling.

**Decision**: Client-side `setInterval()` with React state/ref-based updates. No server polling.

**Rationale**:

- Feature spec: "System MUST display check-in period remaining-time text that updates every second while the check-in window is active."
- "Countdown remains accurate and does not freeze" implies high-frequency client-side updates
- `setInterval` is standard React pattern; `dayjs` provides duration formatting
- Avoids backend load; leverages browser timer precision

**Implementation Pattern**:

```typescript
const useMeetingCheckinTimer = (meeting: Meeting, enabled: boolean) => {
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      forceUpdate((prev) => prev + 1); // Trigger re-render
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  return {
    windowState: calculateWindowState(meeting), // "open", "closed", "not_started"
    remainingTime: calculateRemainingTime(meeting), // formatted string or null
    isUpdating: intervalRef.current !== null,
  };
};
```

**Button Label Stability**:

- Pre-window: Button label = "Check-in starts soon" (static, no countdown)
- Open window: Button label = "Check in" (static); countdown in supporting text
- Closed window: Button disabled or "Status" depending on role

**Alternatives Considered**:

- Server-sent events (REJECTED: overkill for single-user local timer)
- WebSocket polling (REJECTED: same objection; useInterval is simpler)
- `requestAnimationFrame` for 60fps updates (REJECTED: unnecessary; 1Hz sufficient for countdown text)

---

### 6. Concurrent Status Changes (Last-Write-Wins)

**Task**: Define behavior when multiple clients attempt simultaneous status changes (attendee downgrade + admin upgrade).

**Decision**: Last-write-wins. MongoDB atomic update with no transaction/conflict resolution.

**Rationale**:

- "Attendee whose status was downgraded by themselves later has it upgraded by admin; subsequent attendee downgrade is allowed since check-in period remains closed" implies last action takes precedence
- Simplified concurrency model; matches WritersCheckIn's current behavior
- Audit trail preserved via `meetingAttendanceLogs` (already in place)

**Implementation Impact**:

- No explicit locking or conflict detection needed
- Audit log records both actions in order; consumers can inspect `changedBy` and `isAdminOverride` to understand history
- Frontend optimistic updates with rollback on server rejection

**Alternatives Considered**:

- Optimistic locking with version field (REJECTED: adds complexity; last-write-wins acceptable for this domain)
- Server-enforced serialization (REJECTED: hurts concurrency for high-concurrency scenarios)

---

## Summary: Key Design Decisions

| Decision                                             | Impact                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| Timestamps govern eligibility, not calendar dates    | Remove day-of-meeting checks; use pure timestamp comparison |
| Add `startCheckinHoursAfterCreation` field           | Flexible window configuration; default 0                    |
| Downgrade-only for attendees after period closes     | Attendee cannot upgrade; admin can upgrade anytime          |
| Track `changedBy` and `isAdminOverride` on attendees | Audit trail; distinguish attendee vs. admin changes         |
| Client-side `setInterval` for countdown              | Per-second updates without server polling                   |
| Last-write-wins concurrency model                    | Simpler than transactions; audit trail preserved            |

**Alternatives considered**:

- Embed countdown in button text (rejected: explicitly disallowed)
- Remove countdown entirely (rejected: conflicts with live countdown requirement)

---

## Decision 5: Centralize message formatting across feed and detail surfaces

**Decision**: Use shared check-in window message formatting logic so both `MeetingFeedItem` and `group-meeting-view` show consistent countdown and closed/open messaging.

**Rationale**: Prevents divergence between UI surfaces and reduces duplicate timing logic.

**Alternatives considered**:

- Separate formatting implementations per component (rejected: drift risk)
- Hard-code messages in JSX only (rejected: poor maintainability)

---

## Summary

All open questions in technical context are resolved. Implementation should remove same-day gating, keep server-side eligibility enforcement, provide second-level countdown updates during active windows, and maintain stable button labeling with countdown text in supporting copy only.
