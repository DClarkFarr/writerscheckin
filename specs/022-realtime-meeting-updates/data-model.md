# Data Model: Real-time Meeting Updates

## Entity: MeetingSocketPayload (new derived contract)

Represents one emitted `meeting` socket event for one recipient socket.

### Fields

- `groupMeeting: GroupMeetingSocketDocument`
- `groupMember: GroupMemberSocketDocument`
- `meetingAttendee: MeetingAttendeeSocketDocument`

### Validation Rules

- `groupMeeting.groupId` MUST equal `groupMember.groupId`.
- `meetingAttendee.meetingId` MUST equal `groupMeeting.meetingId`.
- `meetingAttendee.memberId` MUST equal `groupMember.membershipId`.
- Payload MUST only be emitted when all three documents are present and aligned.

---

## Entity: GroupMeetingSocketDocument (derived)

Meeting document projected for socket transport.

### Fields

- `meetingId: string`
- `groupId: string`
- `name: string`
- `occursAt: string`
- `description: string`
- `address: string`
- `startTime: { hours: number; minutes: number }`
- `durationMinutes: number`
- `publishEmailMessage: string`
- `attendanceEmailMessage: string`
- `publishHoursBefore: number`
- `notifyAttendanceHoursBefore: number`
- `endCheckinHoursBefore?: number`
- `checkinClosesAt?: string`
- `isCheckinClosedByCuttoff?: boolean`
- `status: "draft" | "published"`
- `cancelledAt?: string | null`
- `createdAt: string`
- `updatedAt: string`

---

## Entity: GroupMemberSocketDocument (derived)

Membership document for the recipient user in the meeting's group.

### Fields

- `membershipId: string`
- `userId: string | null`
- `email: string`
- `role: "owner" | "admin" | "member"`
- `status: "invited" | "accepted" | "declined" | "cancelled" | "removed"`
- `createdAt: string`
- `invitedBy: string | null`
- `invitedAt: string | null`
- `acceptedAt: string | null`

---

## Entity: MeetingAttendeeSocketDocument (derived)

Attendance/check-in document for the recipient membership and meeting.

### Fields

- `meetingAttendeeId: string`
- `meetingId: string`
- `memberId: string`
- `status: "invited" | "attending" | "reading" | "skipping"`
- `createdAt: string`
- `updatedAt: string`

---

## Entity: RecipientSocketSession (existing, referenced)

One connected socket joined to `groupId` room.

### Fields used

- `socketId: string`
- `auth.userId: string`

---

## State Transitions

### Socket emission eligibility

1. Resolve `groupId` and `meetingId` from triggering operation.
2. Resolve room sockets by `groupId`.
3. For each socket:
   - Read `userId` from socket auth.
   - Resolve membership by `userId + groupId`.
   - Resolve attendee by `meetingId + membershipId`.
4. Emit only if membership and attendee are both present.

Transitions:

- `Connected -> Eligible`: membership found and attendee found.
- `Connected -> Skipped`: missing user ID, missing membership, or missing attendee.

### Frontend query-cache transition (`useMyMeetingsQuery`)

- If incoming payload `meetingId` exists in cache: replace that item with mapped aggregate object.
- If payload `meetingId` does not exist: prepend or insert according to existing occursAt ordering policy.
- Preserve dedupe-by-`meetingId` invariants used by current flattening logic.

---

## Backward Compatibility Notes

- Existing REST `/groups/meetings/mine` response remains unchanged.
- New socket `meeting` event is additive and does not alter `group` event.
- Frontend can ignore `meeting` event until query integration is enabled.
