# Contract: Meeting Realtime Socket Event

## Scope

Defines backend emission and payload rules for the new `meeting` socket event.

## Event Name

- `meeting`

## Emission Input

Service method input:

```json
{
  "groupId": "<group-id>",
  "meetingId": "<meeting-id>"
}
```

## Recipient Resolution

1. Fetch sockets joined to room `groupId`.
2. For each socket, read `socket.handshake.auth.userId`.
3. Resolve membership by `userId + groupId`.
4. Resolve attendee by `meetingId + membershipId`.
5. Emit only when membership and attendee both exist.

## Payload Shape

```json
{
  "groupMeeting": {
    "meetingId": "m1",
    "groupId": "g1",
    "name": "Weekly Check-in",
    "occursAt": "2026-05-17T19:00:00.000Z",
    "description": "Agenda",
    "address": "Main Room",
    "startTime": { "hours": 19, "minutes": 0 },
    "durationMinutes": 90,
    "publishEmailMessage": "...",
    "attendanceEmailMessage": "...",
    "publishHoursBefore": 24,
    "notifyAttendanceHoursBefore": 6,
    "status": "published",
    "cancelledAt": null,
    "createdAt": "2026-05-12T19:00:00.000Z",
    "updatedAt": "2026-05-16T17:20:00.000Z"
  },
  "groupMember": {
    "membershipId": "gm1",
    "groupId": "g1",
    "userId": "u1",
    "email": "user@example.com",
    "role": "member",
    "status": "accepted",
    "createdAt": "2026-04-01T09:00:00.000Z",
    "invitedBy": "u2",
    "invitedAt": "2026-04-01T09:00:00.000Z",
    "acceptedAt": "2026-04-01T09:05:00.000Z"
  },
  "meetingAttendee": {
    "meetingAttendeeId": "ma1",
    "meetingId": "m1",
    "memberId": "gm1",
    "status": "reading",
    "createdAt": "2026-05-12T19:00:00.000Z",
    "updatedAt": "2026-05-16T17:20:00.000Z"
  }
}
```

## Required Invariants

- `groupMeeting.groupId === groupMember.groupId` (logical equivalence from source docs).
- `meetingAttendee.meetingId === groupMeeting.meetingId`.
- `meetingAttendee.memberId === groupMember.membershipId`.

## Non-Emission Conditions

- No sockets in room.
- Socket has no authenticated user ID.
- Membership not found for user/group.
- Attendee not found for meeting/membership.

## Error Handling

- Per-recipient lookup failures skip only that recipient.
- Emitter must not throw for empty/skipped recipient sets.
- Unexpected lookup errors should use existing centralized error logging path.
