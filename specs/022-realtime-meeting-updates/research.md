# Research: Real-time Meeting Updates

**Date**: May 16, 2026  
**Feature**: Real-time Meeting Updates  
**Research Phase**: Complete

## Decision 1: Reuse group-room socket discovery pattern from group summary emitter

**Decision**: Reuse the `socketGroupEmitGroupSummaryItem` flow for room lookup and per-socket emit: resolve target room from `groupId`, fetch sockets from the room, and emit to each socket ID individually.

**Rationale**: This preserves current realtime infrastructure behavior and limits risk by following an established path that already handles authenticated room subscribers.

**Alternatives considered**:

- Emit once to room with one payload (rejected: recipient-scoped data would leak across users)
- Build a separate meeting-room topology (rejected: unnecessary because group rooms already exist)

---

## Decision 2: Emit normalized documents, not aggregate response DTO

**Decision**: Define and emit a `meeting` socket payload with separate documents:

- `groupMeeting`
- `groupMember`
- `meetingAttendee`

and let frontend map this payload into `MemberMeetingFeedItem` shape used by `useMyMeetingsQuery`.

**Rationale**: `memberMeetingAggregationRowToResponse` is an aggregate transformer tied to query response composition. Normalized document emission keeps socket payloads explicit, reusable, and easier to version.

**Alternatives considered**:

- Emit aggregated `MemberMeetingFeedItem` from backend (rejected: duplicates aggregate logic and couples socket path to pagination response contract)

---

## Decision 3: Per-recipient data scoping must include both membership and attendee

**Decision**: For each socket recipient, resolve membership by (`userId`, `groupId`) and attendee by (`meetingId`, `membershipId`); skip emission if either record is missing.

**Rationale**: User requirement states recipients without membership/attendance for that meeting should not receive updates. This guarantees recipient relevance and avoids emitting partial meeting state that frontend cannot safely reconcile.

**Alternatives considered**:

- Emit when membership exists and attendee is null (rejected for this feature per explicit requirement to skip when membership-attendance is missing)
- Emit to all room sockets and let frontend filter (rejected: security and data correctness concerns)

---

## Decision 4: Add dedicated model/service mapping helper for meeting socket payload

**Decision**: Add explicit backend mapper for socket payload docs (parallel to API response mappers), rather than reusing `memberMeetingAggregationRowToResponse`.

**Rationale**: Prevents hidden coupling to aggregation-only fields while preserving typed backend contracts.

**Alternatives considered**:

- Reuse API response mapper directly (rejected: requires aggregate row fields unavailable in socket emission path)

---

## Decision 5: Start frontend integration in `useMyMeetingsQuery`

**Decision**: Extend `useMyMeetingsQuery` with helper methods for applying realtime meeting payloads to infinite-query cache pages, then subscribe via existing socket subscription flow.

**Rationale**: This query already owns cache key, pagination flattening, and dedupe behavior for meetings feed, making it the canonical location for realtime upserts.

**Alternatives considered**:

- Update cache directly from tab component (rejected by constitution Principle XII hook/query ownership)
- Add separate standalone store for meeting realtime updates (rejected as unnecessary complexity)

---

## Decision 6: Trigger socket meeting emits from meeting-changing routes/services

**Decision**: After meeting-changing operations (check-in updates, publish, cancel, meeting edits), invoke new meeting emitter using resolved `groupId` + `meetingId`.

**Rationale**: Ensures clients receive canonical updates from all meaningful meeting state transitions.

**Alternatives considered**:

- Emit only on check-in updates (rejected: misses publish/cancel/edit changes)
- Emit only from cron/publication jobs (rejected: misses user-driven changes)

---

## Summary

All clarifications are resolved. The implementation plan will use group-room socket lookup, per-socket recipient scoping by membership+attendee, normalized `meeting` payload docs, and frontend cache reconciliation owned by `useMyMeetingsQuery`.
