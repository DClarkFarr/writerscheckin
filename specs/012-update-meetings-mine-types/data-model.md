# Data Model: Meetings Mine Aggregation Alignment

## Entity: MemberMeetingAggregationItem

- Purpose: Internal backend aggregation row representing one meeting visible to the current member, enriched with membership context.
- Base shape: Group meeting document fields currently emitted by `groupMeetingDocumentToResponse`.
- Relationships:
  - Includes one `membership` object representing the user’s membership for the meeting’s group.
  - Includes zero or one `attendance` object representing the current user’s attendee row for that meeting.
  - Includes one `counts` object added after aggregation result hydration.
- Validation rules:
  - `meetingId`, `groupId`, and nested membership identifiers must serialize as strings.
  - `occursAt` must remain the canonical sort and cursor field.
  - `attendance` is nullable when no attendee row exists for the current user.
  - `counts.attending` and `counts.reading` default to `0` when no aggregate row exists.

## Entity: MemberMeetingCounts

- Purpose: Compact count summary attached to each serialized member meeting row.
- Fields:
  - `attending`: number
  - `reading`: number
- Derivation:
  - Computed by aggregating `meetingAttendees` for all page meeting ids in one query.
  - `attending` counts both `attending` and `reading` attendee statuses to match current product semantics.
  - `reading` counts only `reading` attendee statuses.

## Entity: MemberMeetingAttendance

- Purpose: Serialized current-user attendee record nested under a member meeting row.
- Fields:
  - `meetingAttendeeId`
  - `meetingId`
  - `memberId`
  - `status`
  - `createdAt`
  - `updatedAt`
- Validation rules:
  - Present only when the current user has an attendee row for the meeting.
  - `status` remains one of `invited`, `attending`, `reading`, or `skipping` based on the attendee persistence model.

## Entity: MemberMeetingFeedItem

- Purpose: Shared frontend/backend API contract for `/groups/meetings/mine` rows.
- Shape:
  - Base serialized meeting document fields from `groupMeetingDocumentToResponse`
  - `membership`: serialized group membership response
  - `attendance`: serialized current-user attendee response or `null`
  - `counts`: `MemberMeetingCounts`
- Explicitly excluded derived UI fields:
  - `segment`
  - `isAdminOnly`
  - `showAdminOnlyBadge`
  - `canCheckin`
- Compatibility notes:
  - Response collection uses `rows`, not `items`.
  - Frontend query flattening and optimistic updates must key on `meetingId` exactly as before.

## Entity: MemberMeetingDerivedState

- Purpose: Frontend-only computed state used by cards, drawers, and interaction affordances.
- Derived fields:
  - `segment`: derived from `occursAt` compared with current client time.
  - `canCheckin`: derived from `status`, `occursAt`, and any product rules for check-in availability.
  - `showAdminOnlyBadge`: derived from `status === "draft"` and/or membership role, depending on final UI needs.
  - `displayTone`: derived from temporal segment and current attendance status.
  - `attendanceState`: derived from nested `attendance.status`, with `skipping` mapped to `not_attending` and missing attendance mapped to `none`.
- Rules:
  - Keep derivation pure and side-effect free.
  - If used in multiple components, expose through a shared hook or selector helper instead of duplicating conditionals.

## State Transitions

- Meeting pagination transition:
  - Raw aggregation rows are fetched in cursor order.
  - Rows are enriched with `counts`.
  - Rows are serialized into `MemberMeetingFeedItem` and returned as `rows` plus `nextCursor`.
- Attendance mutation transition:
  - UI updates nested `attendance.status` optimistically.
  - UI may create an optimistic nested `attendance` object when the prior value is `null`.
  - UI updates `counts` optimistically using the same transition rules currently applied to top-level count fields.
  - Server response remains the source of truth after invalidation/refetch.
