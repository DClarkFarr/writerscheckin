# Starting local server

```
brew services start mongodb/brew/mongodb-community
```

## Model and Service Boundaries

- Models in express/src/models are CRUD-only and must not import other models.
- Services in express/src/services orchestrate multi-collection workflows using model functions only.
- Run the model import check with `npm run check:model-imports`.

## Meeting Auto-Publish Scheduler Runbook

- Scheduler entrypoint: `express/src/server.ts` initializes cron jobs after API startup.
- Cron schedule: `*/1 * * * *` (every minute), timezone `America/Denver`.
- Job class: `express/src/jobs/PublishScheduledMeetings.ts`.
- Queue behavior: `express/src/services/QueueService.ts` serializes execution (`concurrency = 1`) and clears backlog when max queue size is exceeded.

### Scheduler Responsibility Split

- Job and scheduler classes may write operational logs to terminal.
- Service methods return structured data and do not log to terminal.
- Publish orchestration lives in `publishDueMeetingsBatch` and `publishMeetingFromSchedule` in `express/src/services/groupMeetingsService.ts`.

### Due Meeting Selection Rules

- Only meetings with `status = draft` are candidates.
- Computed publish time is `occursAt - publishHoursBefore`.
- A meeting is due when computed publish time falls in the trailing 20-minute window.
- Cancelled meetings are skipped.

### Publish Side Effects

- Meeting transitions to `published` and updates timestamps.
- Recipients are group members excluding statuses `cancelled` and `removed`.
- Each recipient gets a meeting attendee row with status `invited` (idempotent create-or-return behavior).
- Email notifications are sent using the publish email message template.

### Operations Checklist

1. Ensure MongoDB is running.
2. Build backend: `cd express && npm run build`.
3. Start server and observe logs for scheduler startup.
4. Seed a due draft meeting and confirm job summary logs include candidate and published counts.
5. Re-run or wait next tick and confirm no duplicate attendee creation for the same meeting/member pair.
