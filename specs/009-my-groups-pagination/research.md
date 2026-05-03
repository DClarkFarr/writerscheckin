# Research: My Groups Pagination

## Decision 1: Standardize group reads around summary payloads plus dedicated paginated collections

- Decision: Keep `/groups/mine` and `/groups/:groupId` as summary/detail-summary contracts that return group fields and counts, but never embed full member lists. Add dedicated members and meetings read contracts for collection data.
- Rationale: The current backend already distinguishes list summary data from detailed editing data, but `getManagedGroupForm` still returns the full `members` array. Splitting members and meetings into dedicated reads removes overfetching, keeps list/detail payloads predictable, and matches the feature requirement that member rosters load only after opening a group.
- Alternatives considered: Continue returning `members` from `/groups/:groupId` and let the frontend ignore them. Rejected because it preserves payload bloat and weakens the standardized response boundary.

## Decision 2: Use cursor-based pagination for My Groups and load-more detail collections

- Decision: Keep My Groups on cursor pagination and extend the same `rows + nextCursor` pagination contract to group members and group meetings, with a default batch size of 20.
- Rationale: My Groups already uses cursor pagination via `encodeCursor` and `decodeCursor`, and the frontend `GroupEventsResponse` type already expects `nextCursor`. A consistent cursor contract avoids duplicate rows when records are inserted between fetches and lets query wrappers share a single incremental loading pattern.
- Alternatives considered: Use offset pagination for members and meetings because `groupMeetings.ts` already has an offset-based helper. Rejected because offset pagination is more fragile under concurrent writes and would force divergent frontend load-more logic.

## Decision 3: Start detail summary, members, and meetings queries in parallel once `groupId` is known

- Decision: On group view, group edit, and summary modal surfaces, start the summary query and the first members and meetings page queries in parallel as soon as the group detail context opens.
- Rationale: The feature requires members and meetings to be separate queries, but not serialized behind the summary request. Independent query hooks preserve cache separation and reduce wait time for the first visible member/meeting batch.
- Alternatives considered: Gate members and meetings queries on successful summary completion. Rejected because it adds avoidable latency without improving correctness; authorization is already enforced on the backend per endpoint.

## Decision 4: Keep frontend transport in `api/groups.ts` and move orchestration into new query wrappers

- Decision: Add typed API functions for paginated group members and paginated group meetings in `web/src/api/groups.ts`, then expose them through dedicated query hooks in `web/src/queries` with `.key` methods and flattened append semantics.
- Rationale: This matches Constitution Principle XII and keeps pagination state, error mapping, and cache ownership out of components.
- Alternatives considered: Call new members/meetings endpoints directly from pages or modal components. Rejected because it violates the repository’s query-hook policy and would duplicate loading logic.
