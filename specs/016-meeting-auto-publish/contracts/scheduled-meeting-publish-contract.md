# Contract: Scheduled Meeting Publish Orchestration

## Purpose

Define the service contract for publishing due meetings and applying side effects (emails + attendee invitations).

## Contract scope

- Layer: service internal orchestration, invoked by cron job class
- Input: due draft meeting candidates from discovery contract
- Output: typed per-meeting and batch results for job logging

## Publish flow contract

For each due meeting candidate:

1. Re-load/validate current meeting state.
2. Skip if not draft or canceled.
3. Publish meeting:
   - set `status = "published"`
   - update timestamps (`updatedAt`, and other standard touched fields)
4. Query group members at execution time and include recipients where status is not `cancelled` and not `removed`.
5. For each recipient:
   - create meeting attendee with `status = "invited"`
   - send publish email using meeting `publishEmailMessage` as template/body basis
6. Return typed result summary.

## Method contract (internal)

```ts
interface PublishMeetingFromScheduleInput {
  meetingId: string;
  now: Date;
}

interface PublishMeetingFromScheduleResult {
  meetingId: string;
  groupId: string;
  published: boolean;
  reason: "published" | "already_published" | "cancelled" | "skipped" | "error";
  publishedAt: string | null;
  recipientCount: number;
  attendeeCreatedCount: number;
  emailSentCount: number;
  errorMessage?: string;
}

interface PublishDueMeetingsBatchInput {
  now: Date;
  windowMinutes: number; // default 20
}

interface PublishDueMeetingsBatchResult {
  startedAt: string;
  finishedAt: string;
  candidateCount: number;
  publishedCount: number;
  skippedCount: number;
  errorCount: number;
  results: PublishMeetingFromScheduleResult[];
}
```

## Idempotency and deduplication requirements

- A meeting can transition to `published` once.
- Attendee creation must avoid duplicate `(meetingId, memberId)` rows.
- Re-running the same batch window should not create duplicate publishes or attendee rows.

## Logging boundary

- Service methods return data only and do not write to terminal.
- Job class logs one batch summary and optional per-meeting lines.

## Error behavior

- Per-meeting failures should be represented in result rows when possible, allowing batch completion.
- Fatal infrastructure failures may throw and be caught/logged at job layer.
