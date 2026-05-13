# Contract: Scheduled Meeting Discovery

## Purpose

Define the model/service contract for selecting meetings due for automatic publication.

## Contract scope

- Layer: model + service internal contract
- Trigger: scheduler tick (cron job)
- Input: current execution time (`now`) and trailing window duration (20 minutes)

## Discovery rules

1. Only meetings with `status = "draft"` are eligible.
2. Ignore meetings that are canceled (`cancelledAt` present).
3. Compute `publishAt` per row as `occursAt - publishHoursBefore`.
4. Return meetings where computed `publishAt` is between `now - 20 minutes` and `now`.
5. Results should be stable for deterministic processing order (oldest computed `publishAt` first, then `_id`).

## Method contract (internal)

```ts
interface ListDueDraftMeetingsInput {
  now: Date;
  windowMinutes: number; // default 20
}

interface DueDraftMeeting {
  meetingId: string;
  groupId: string;
  occursAt: string;
  publishHoursBefore: number;
  publishEmailMessage: string;
  status: "draft";
}

type ListDueDraftMeetings = (
  input: ListDueDraftMeetingsInput,
) => Promise<DueDraftMeeting[]>;
```

## Service behavior

- Service returns typed rows only.
- Service does not perform terminal output.
- Service may include optional summary metadata in return value, but logging is job-owned.

## Error behavior

- Validation errors for invalid `windowMinutes` should throw typed validation errors.
- Data access failures should throw errors to be handled by scheduler/job boundary.
