# Contract: GET /groups/meetings/mine

## Purpose

Return the current member’s meetings in cursor order using a document-like response shape aligned with the aggregation pipeline.

## Request

- Method: `GET`
- Path: `/groups/meetings/mine`
- Query params:
  - `cursor?: string`
  - `limit?: number`
- Auth: required session user

## Backend assembly contract

1. Resolve the authenticated user id in the router.
2. Decode the cursor in the router.
3. Call a service that orchestrates model-owned aggregation helpers.
4. Fetch paginated meeting rows in stable `occursAt desc, _id desc` order.
5. After cursor filtering, join current-user attendance into each row as `attendance` or `null`.
6. Enrich the fetched rows with `counts` using a single aggregate-by-meeting-ids helper.
7. Serialize each enriched row through `memberMeetingAggregationRowToResponse`, preserving nested `membership`, `attendance`, and `counts` keys.
8. Return `nextCursor` from the last row’s `occursAt` and `_id`.

## Response

```ts
interface ListMemberMeetingsResponse {
  rows: MemberMeetingFeedItem[];
  nextCursor: string | null;
}

interface MemberMeetingFeedItem {
  meetingId: string;
  groupId: string;
  name: string;
  occursAt: string;
  description: string;
  address: string;
  startTime: {
    hours: number;
    minutes: number;
  };
  durationMinutes: number;
  publishEmailMessage: string;
  attendanceEmailMessage: string;
  publishHoursBefore: number;
  notifyAttendanceHoursBefore: number;
  status: "draft" | "published";
  membership: GroupMemberResponse;
  attendance: MemberMeetingAttendance | null;
  counts: {
    attending: number;
    reading: number;
  };
}

interface MemberMeetingAttendance {
  meetingAttendeeId: string;
  meetingId: string;
  memberId: string;
  status: "invited" | "attending" | "reading" | "skipping";
  createdAt: string;
  updatedAt: string;
}
```

## Serialization rules

- Meeting document fields remain as close as practical to the existing persisted shape, normalized only for ids and dates.
- `membership` reuses the existing serialized group member response contract.
- `attendance` remains nested rather than flattened into `userCheckinState`; the frontend maps `skipping` to `not_attending` as derived state.
- `counts` is the only additional non-document object added for list efficiency.
- No UI-only booleans or temporal labels are returned.

## Cursor rules

- Cursor encoding remains based on `occursAt` and `_id`.
- Cursor filtering must compare `occursAt`, not `date`.
- Ties on `occursAt` break on `_id desc`.

## Error contract

- Invalid auth: existing auth error behavior unchanged.
- Invalid cursor: existing cursor decode behavior unchanged.
- Empty result set: return `rows: []` and `nextCursor: null`.
