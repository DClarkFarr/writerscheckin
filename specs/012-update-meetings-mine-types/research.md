# Research: Meetings Mine Aggregation Alignment

## Decision 1: Promote the aggregation response shape to the shared feed contract

- Decision: Replace the shared `MyMeetingFeedItem` contract with `MemberMeetingFeedItem`, defined as the serialized form of the aggregation row returned from `/groups/meetings/mine` after `memberMeetingAggregationRowToResponse` runs.
- Rationale: The backend endpoint already returns aggregation-backed `rows`, while the frontend still normalizes a legacy `items` DTO with fields that no longer exist. Making the shared type reflect the real serialized row removes double-mapping and gives the React app one canonical contract.
- Alternatives considered:
  - Keep `MyMeetingFeedItem` and translate the aggregation row back into the legacy DTO. Rejected because it reintroduces server-derived UI state and hides the actual backend contract.
  - Expose raw aggregation rows directly without a response serializer. Rejected because response objects still need ObjectId and Date normalization plus selective field omission.

## Decision 2: Keep derived UI state in the React app

- Decision: Remove server-derived properties such as `segment`, `isAdminOnly`, `showAdminOnlyBadge`, and `canCheckin` from the API contract and derive them in components or a shared frontend hook/selector when the logic is reused.
- Rationale: These values depend on presentation or client time context rather than persisted data. Returning document-like records plus `membership`, `attendance`, and `counts` keeps the API stable while letting the UI derive its own view state.
- Alternatives considered:
  - Continue calculating these fields in Express. Rejected because the contract becomes UI-specific and drifts further from the persisted data model.
  - Derive everything inline in each component with no shared helper. Rejected because repeated logic across cards, drawers, and mutations would drift over time.

## Decision 3: Enrich rows with counts before final serialization

- Decision: Add a `populateMeetingsWithCounts()` service helper that gathers meeting ids from the paginated aggregation result, calls a model aggregate helper for all ids in one query, attaches a `counts` object to each row, and then passes the enriched rows into `memberMeetingAggregationRowToResponse`.
- Rationale: The response contract needs `counts`, but per-row lookups would create an avoidable N+1 query pattern. The repository already contains a multi-meeting aggregate in `meetingCheckins.ts`, which can be reused or wrapped while keeping the service responsible only for orchestration.
- Alternatives considered:
  - Compute counts inside the main meetings aggregation pipeline. Rejected for now because it would make the pipeline denser and harder to reason about while an aggregate-by-meeting-ids helper already exists.
  - Fetch counts one meeting at a time. Rejected because it scales poorly and undermines pagination performance.

## Decision 4: Attach current-user attendance inside the paginated aggregation flow

- Decision: Extend `getAggregationMemberMeetingsPaginated` so that after `matchAfterCursor` it performs a lookup into `meetingAttendees` filtered to the current membership or user context, unwinds the result, and exposes `attendance` on each aggregation row as either the attendee document or `null`.
- Rationale: The UI and optimistic mutation layer need the user’s current attendance state, and exposing it as a document-like nested object fits the “preserve document structure” rule better than flattening it into another derived string field.
- Alternatives considered:
  - Keep only `userCheckinState` as a flattened string on the response. Rejected because it loses fidelity and pushes more ad hoc mapping into the service layer.
  - Fetch attendance in a second per-meeting query. Rejected because it adds avoidable read amplification.

## Decision 5: Use model-owned aggregation helpers to restore constitution compliance

- Decision: Move or introduce Mongo aggregation executors in model files and keep `groupMeetingsService.ts` focused on composing model results plus serialization.
- Rationale: The current `groupMeetingsService.ts` imports `getCollection()` and runs aggregation pipelines directly, which conflicts with the constitution’s model/service split. This feature already touches the aggregation path, so it is the right moment to correct the ownership boundary.
- Alternatives considered:
  - Leave the aggregation in the service and treat it as a pre-existing exception. Rejected because the feature work expands that violation.
  - Move all serialization into models as well. Rejected because response assembly belongs in services, not models.
