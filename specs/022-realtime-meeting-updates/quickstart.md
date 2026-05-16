# Quickstart: Real-time Meeting Updates

## Goal

Deliver realtime `meeting` socket events to group-connected users with per-recipient scoped meeting membership+attendee documents and feed them into `useMyMeetingsQuery` cache updates.

## Implementation Order

1. Backend socket payload contract and emitter

- Add socket payload response types for meeting, membership, attendee documents.
- Add `socketGroupEmitMeetingItem({ groupId, meetingId })` in [express/src/services/socketEventsService.ts](express/src/services/socketEventsService.ts).
- Reuse room lookup pattern from `socketGroupEmitGroupSummaryItem`.

2. Recipient scoping logic

- Resolve sockets in room by `groupId`.
- For each socket, read `auth.userId`.
- Lookup membership by (`userId`, `groupId`).
- Lookup attendee by (`meetingId`, `membershipId`).
- Skip emit if either membership or attendee is missing.

3. Trigger points for meeting updates

- After check-in mutation response.
- After publish/cancel operations.
- After meeting edit/save operations.
- Pass both `groupId` and `meetingId` to the emitter.

### Final emitter trigger matrix

| Route/flow                                              | Trigger condition                        | Emit call                                                  |
| ------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `POST /api/groups/meetings/:meetingId/checkin`          | Check-in state changed successfully      | `socketGroupEmitMeetingItem(data.groupId, data.meetingId)` |
| `PATCH /api/groups/:groupId/meetings/:meetingId/edit`   | Meeting autosave patch persisted         | `socketGroupEmitMeetingItem(groupId, meetingId)`           |
| `POST /api/groups/:groupId/meetings/:meetingId/publish` | Draft meeting published successfully     | `socketGroupEmitMeetingItem(groupId, meetingId)`           |
| `POST /api/groups/:groupId/meetings/:meetingId/cancel`  | Published meeting cancelled successfully | `socketGroupEmitMeetingItem(groupId, meetingId)`           |

4. Frontend API types and query integration

- Add `MeetingSocketPayload` type in [web/src/api/types/groups.ts](web/src/api/types/groups.ts).
- Extend [web/src/queries/useMyMeetingsQuery.ts](web/src/queries/useMyMeetingsQuery.ts) with:
  - mapper from socket payload to `MemberMeetingFeedItem`
  - cache upsert helper(s) scoped to `myMeetingsQueryKey()`
  - exported utility for socket subscriber usage

5. Socket subscription application

- Extend group socket subscription hook to listen for `meeting` events.
- Delegate data application to helper exported from `useMyMeetingsQuery` module.
- Keep query ownership in query module, not page component.

6. Manual validation

- Connect two users to same group room.
- Trigger meeting update.
- Verify only users with both membership and attendee receive `meeting` payload.
- Verify payload maps into feed cache and updates item in My Meetings tab without refresh.

## Manual Validation Scenarios

1. Happy path recipient update

- User A and B connected to room.
- Both have membership and attendee for meeting.
- Both receive `meeting` event and feed row updates.

2. Membership missing

- Socket connected but no group membership.
- Event not emitted to that socket.

3. Attendee missing

- Membership exists but attendee absent for meeting.
- Event not emitted to that socket.

4. Multi-tab behavior

- One user with two sockets in same room.
- Both sockets receive scoped event.

5. No connected sockets

- Trigger update with empty room.
- Emitter exits without error.

## Build Checks

- `cd express && npm run build`
- `cd web && npx tsc --noEmit`

## Notes

- Start frontend work in `useMyMeetingsQuery` as requested; socket hook should call query-owned helpers for cache writes.

## Validation Notes (May 16, 2026)

- Backend compile validation passed: `cd express && npm run build`.
- Frontend typecheck validation passed: `cd web && npx tsc --noEmit`.
- Manual multi-user socket verification scenarios remain pending.
