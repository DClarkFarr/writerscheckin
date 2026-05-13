# Research: Meeting Auto Publish

## Decision 1: Compute due publication from existing meeting fields

- Decision: Derive publish moment as `occursAt - publishHoursBefore` per meeting and query draft meetings whose computed publish moment is within `[now - 20 minutes, now]`.
- Rationale: This matches the requirement without introducing a new persisted `publishAt` field and keeps source of truth in existing meeting fields.
- Alternatives considered:
  - Persist a `publishAt` column and keep it synced on every edit. Rejected for added write-path complexity and backfill risk.
  - Publish only when computed moment equals current minute. Rejected because missed scheduler ticks would skip valid meetings.

## Decision 2: Separate operational logging from business methods

- Decision: Keep terminal output (`console.info`, `console.error`) in cron/job classes only, while service methods return structured result objects and throw typed errors.
- Rationale: Preserves clean architecture and testability; scheduler concerns remain operational, service concerns remain domain/business.
- Alternatives considered:
  - Log inside services for convenience. Rejected because it couples business logic to runtime environment and violates requested pattern.
  - Return only booleans from services and infer context in jobs. Rejected because jobs need rich per-meeting outcomes for accurate logs.

## Decision 3: Define active recipients by membership status exclusion

- Decision: Notification and attendee creation targets are group members whose status is not `cancelled` and not `removed` at publish execution time.
- Rationale: Aligns exactly to the requirement and avoids stale participant lists captured at scheduling time.
- Alternatives considered:
  - Notify only `accepted` members. Rejected because requirement explicitly excludes only `cancelled`/`removed`.
  - Snapshot recipients at meeting creation. Rejected because membership can change before publication.

## Decision 4: Publish flow is idempotent and side-effect aware

- Decision: Before side effects, confirm meeting is still draft and not canceled; then publish once, upsert/create attendees safely, and send one email per active member.
- Rationale: Scheduler retries and overlapping ticks should not duplicate publish transitions or attendee rows.
- Alternatives considered:
  - Blind publish/update on each tick. Rejected due to duplicate work and duplicate notifications.
  - Skip attendee uniqueness guard. Rejected because attendee duplication breaks check-in semantics.

## Decision 5: Use queue + cron cadence for controlled execution

- Decision: Keep cron trigger frequent (every minute) and execute publication work through `p-queue-cjs` with concurrency 1.
- Rationale: Frequent checks reduce publish delay while queue serialization prevents concurrent publish loops in one process.
- Alternatives considered:
  - Run cron every 15 or 20 minutes only. Rejected because publish latency would be too coarse.
  - Run jobs without queue protection. Rejected due to overlap risks during slow ticks.
