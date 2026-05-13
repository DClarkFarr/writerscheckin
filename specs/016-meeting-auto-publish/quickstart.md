# Quickstart: Meeting Auto Publish

## Implementation order

1. Add/confirm scheduler wiring in [express/src/server.ts](express/src/server.ts) so cron triggers enqueue publish job execution through [express/src/services/QueueService.ts](express/src/services/QueueService.ts).
2. Implement due-meeting discovery model method in [express/src/models/groupMeetings.ts](express/src/models/groupMeetings.ts) for `draft` meetings where computed `publishAt` falls in trailing 20-minute window.
3. Add service-layer discovery method in [express/src/services/groupMeetingsService.ts](express/src/services/groupMeetingsService.ts) that calls model discovery and returns typed candidates (no terminal output).
4. Implement per-meeting publish service orchestration in [express/src/services/groupMeetingsService.ts](express/src/services/groupMeetingsService.ts):
   - guard idempotency (skip if not draft or canceled),
   - set meeting status to published with updated timestamps,
   - query active group members excluding `cancelled`/`removed`,
   - create attendee rows with `status = invited`,
   - send publish emails using `publishEmailMessage` text.
5. Implement batch publish service in [express/src/services/groupMeetingsService.ts](express/src/services/groupMeetingsService.ts) returning one aggregate result object for the job.
6. Implement [express/src/jobs/PublishScheduledMeetings.ts](express/src/jobs/PublishScheduledMeetings.ts) to call batch service and print concise result summaries to terminal.
7. Keep logging only in job and scheduler classes; remove/avoid service-level console output.
8. Confirm queue settings (concurrency and max-size behavior) in [express/src/services/QueueService.ts](express/src/services/QueueService.ts) support single-flight execution.

## Verification checklist

1. Meeting with `occursAt` at noon and `publishHoursBefore = 12` is selected as due at midnight by computed publish time.
2. Due meeting transitions from `draft` to `published` exactly once.
3. `updatedAt` changes on publish transition.
4. Members with statuses `cancelled` and `removed` are excluded from recipient list.
5. All active recipients each receive one publish email using `publishEmailMessage` text.
6. All active recipients each have one `meetingAttendees` row with `status = invited`.
7. Re-running the job does not duplicate publish status transition or attendee rows.
8. Terminal output appears from job/scheduler only, not from service functions.

## Suggested validation commands

```bash
cd express && npm run build
```

## Manual checks

1. Seed a draft meeting due in the past 20 minutes and run the job; verify publish and side effects.
2. Seed memberships across `accepted`, `invited`, `declined`, `cancelled`, and `removed`; verify only non-cancelled/non-removed are processed.
3. Re-run job immediately; verify idempotent results and no duplicate attendees.
4. Inspect logs to confirm result summary is emitted by job class.

## Validation outcomes (2026-05-12)

1. Build validation succeeded: `cd express && npm run build` completed with no TypeScript errors after implementation.
2. Due window logic implemented in model layer using computed `publishAt` and trailing 20-minute selection.
3. Publish batch orchestration now returns structured results and avoids service-layer terminal logging.
4. Meeting publish path now creates invited attendees idempotently (`createMeetingAttendeeIfMissing`) for active recipients.
5. Recipient filtering excludes `cancelled` and `removed` membership statuses at publish execution time.
6. Scheduled job logs concise batch summaries from job layer only.

## Remaining manual runtime checks

1. Run server against seeded local data to observe minute-by-minute scheduler execution in terminal output.
2. Verify outbound email delivery in a configured mailer environment.
3. Verify recipient resolution path for members without linked user records but with stored invite email.
