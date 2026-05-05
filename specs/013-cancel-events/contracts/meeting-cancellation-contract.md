# Contract: Cancel Group Meeting

## Purpose

Define the backend contract for canceling a published meeting while keeping canceled meetings queryable in existing meeting endpoints.

## Request

- Method: `POST`
- Path: `/groups/:groupId/meetings/:meetingId/cancel`
- Auth: required session user
- Body: none required for baseline flow

## Preconditions

1. Caller must be authorized as group owner/admin for the meeting's group.
2. Meeting must exist and belong to `:groupId`.
3. Meeting must currently be `status = "published"`.
4. Meeting must not already be canceled.

## Backend behavior contract

1. Resolve user identity and membership role.
2. Load meeting by id and validate group association.
3. Reject if meeting is not published.
4. Persist lifecycle transition atomically:
   - `status = "cancelled"`
   - `cancelledAt = nowISO`
   - update timestamps.
5. Trigger existing RSVP notification workflow for meeting cancellation.
6. Return normalized cancellation result.

## Response

```ts
interface CancelMeetingResponse {
  meetingId: string;
  status: "cancelled";
  cancelledAt: string;
}
```

## Query compatibility contract

- Canceled meetings remain included in existing meeting queries (including my meetings and meeting detail) under normal filtering behavior.
- Existing query pagination/order behavior remains unchanged.
- Meeting serializers include `cancelledAt` as nullable field for all meeting payloads.

## Operation guards for canceled meetings

- Edit/update meeting mutation requests must be rejected when `status = "cancelled"`.
- Publish mutation requests must be rejected when `status = "cancelled"`.
- Check-in mutation requests must be rejected when meeting is canceled.

## Error contract

- `401/403` when not authenticated/authorized.
- `404` when meeting is not found in group scope.
- `400` when meeting is not in a cancel-eligible state.
- `409` when a concurrent request already canceled the meeting.
