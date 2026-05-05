# Contract: Frontend Derived State For Member Meetings

## Purpose

Define the frontend-only state derived from `MemberMeetingFeedItem` so presentation logic stays out of the API contract.

## Inputs

- `MemberMeetingFeedItem`
- Current client time
- Optional UI context such as whether the card or drawer needs status text, badge visibility, or button labels

## Required selectors

- `getMemberMeetingSegment(item, now)`
  - Returns `"upcoming"` or `"past"` from `occursAt`.
- `getMemberMeetingAttendanceState(item)`
  - Reads `attendance?.status`, maps absent attendance to `"none"`, and maps `"skipping"` to `"not_attending"`.
- `canCheckInToMemberMeeting(item, now)`
  - Derived from meeting publication status and time-based rules.
- `showMemberMeetingAdminOnlyBadge(item)`
  - Derived from draft visibility semantics instead of a server flag.
- `getMemberMeetingDisplayTone(item, now)`
  - Derived from segment plus attendance status for card styling.

## Query and cache expectations

- The infinite query owns the canonical cache entry for `/groups/meetings/mine`.
- Query pages should flatten `rows`, not `items`.
- Cache merging continues deduplicating by `meetingId`.

## Optimistic update expectations

- The check-in mutation updates nested `attendance.status` optimistically.
- The check-in mutation creates an optimistic nested attendance object when one does not yet exist.
- The check-in mutation updates `counts.attending` and `counts.reading` optimistically using the same status-delta logic as the current flat fields.
- The mutation invalidates the my-meetings query after settlement so the server remains authoritative.

## Fallback behavior

- Invalid or missing `occursAt` values render as `Date TBD` and `Time TBD` in the card UI instead of throwing formatting errors.
- Empty or whitespace-only meeting names render as `Untitled meeting`.
- Missing count values fall back to `0`.
- The drawer disables attendance actions when derived check-in eligibility is false and shows explanatory helper text.

## Reuse guidance

- If more than one component needs the same derived meeting state, centralize the logic in a hook or selector helper rather than duplicating conditionals.
- Pure formatting concerns such as date labels still belong in existing date utilities.
