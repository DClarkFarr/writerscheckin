# Contract: My Meetings Query Realtime Mapping

## Scope

Defines how frontend maps `meeting` socket payloads into cache records used by `useMyMeetingsQuery`.

## Source Event

- Socket event: `meeting`
- Payload: `MeetingSocketPayload` (meeting + membership + attendee documents)

## Target Cache

- Query key owner: `useMyMeetingsQuery.key()`
- Query data shape: infinite pages containing `rows: MemberMeetingFeedItem[]`

## Mapping Rules

1. Convert `groupMeeting` document fields to `MemberMeetingFeedItem` meeting fields.
2. Convert `groupMember` into `membership` field shape.
3. Convert `meetingAttendee` into `attendance` field shape.
4. Preserve or recalculate `counts` using event payload or existing cached counts policy.
5. Keep one item per `meetingId` across all pages.

## Upsert Rules

- If `meetingId` exists: replace that item in all pages where present.
- If `meetingId` does not exist: insert item in first page (or sorted insertion strategy if defined).
- Dedupe by `meetingId` after upsert.

## Hook Ownership Rules (Constitution Principle XII)

- Cache write helper must live in [web/src/queries/useMyMeetingsQuery.ts](web/src/queries/useMyMeetingsQuery.ts).
- Socket hook may call exported query helper but should not embed mapping/business logic.
- Components must not call `@/api/*` directly for this flow.

## Failure Behavior

- Invalid socket payload shape: ignore event and keep cache unchanged.
- Missing required docs in payload: ignore event and keep cache unchanged.
- Query cache absent: no-op until query is initialized.

## Validation Checklist

- Existing row updates in-place on incoming event.
- New row insertion appears without full refetch.
- Duplicate `meetingId` entries are not introduced.
- `MyMeetingsTab` displays updated data immediately from query cache.
