# Research: Backfill Meeting Attendees

## Decision 1: Backfill only when membership transitions to accepted

- Decision: Trigger attendee backfill only in existing flows that set membership status to accepted.
- Rationale: This directly matches the reported failure (late membership after publication) and avoids adding background reconciliation logic.
- Alternatives considered:
  - Scheduled backfill job: rejected because it adds operational complexity for a deterministic event-driven case.
  - Backfill on every My Meetings read: rejected because it adds write side effects to read paths and can create avoidable load.

## Decision 2: Reuse idempotent attendee creation already in the model layer

- Decision: Use createMeetingAttendeeIfMissing for every candidate meeting during backfill.
- Rationale: The model already combines a unique index with duplicate-key conflict handling, giving safe retries and exactly one attendee row per user-meeting pair.
- Alternatives considered:
  - New bulk upsert pathway: rejected as unnecessary complexity for current scale and requirements.
  - Manual pre-check only: rejected because concurrent writes still require duplicate-safe handling.

## Decision 3: Reuse existing eligibility semantics for membership-based visibility

- Decision: Backfill attendees only for meetings that are eligible for member participation under existing rules (published and not cancelled for member-facing paths).
- Rationale: Keeps behavior aligned with current product rules and avoids introducing a second definition of eligibility.
- Alternatives considered:
  - Include all non-draft meetings: rejected because it may include states that should not receive new attendee rows.
  - Include only future meetings: rejected as a hard rule unless current product behavior explicitly requires it.

## Decision 4: Keep API shapes unchanged

- Decision: Preserve existing request/response contracts for membership and invite endpoints; add attendee backfill as an internal side effect only.
- Rationale: User problem is data consistency, not API shape. Avoiding payload changes reduces regression risk.
- Alternatives considered:
  - Add backfill summary fields to responses: rejected as unnecessary for feature correctness.

## Decision 5: No frontend logic changes unless a proven filter bug remains

- Decision: Implement backend attendee backfill first; only adjust frontend if verification still shows missing visibility.
- Rationale: The report points to missing attendee persistence. Changing frontend without proof risks adding nonessential behavior.
- Alternatives considered:
  - Preemptive frontend fallback rendering for null attendance: deferred unless backend fix alone is insufficient.
