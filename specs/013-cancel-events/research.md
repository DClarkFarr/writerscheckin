# Research: Cancel Published Meetings

## Decision 1: Add explicit canceled lifecycle state for meetings

- Decision: Extend meeting publication status to `"draft" | "published" | "cancelled"` and treat cancellation as a first-class lifecycle transition.
- Rationale: Existing behavior and guards are status-driven. Adding an explicit `cancelled` status allows consistent backend checks and frontend affordance logic without inventing side-channel flags.
- Alternatives considered:
  - Keep status as `draft | published` and infer canceled from `cancelledAt`. Rejected because status-only guards become ambiguous and every call site would need dual-condition checks.
  - Hard-delete canceled meetings. Rejected because the requirement states canceled meetings should be queried like any other meeting.

## Decision 2: Persist `cancelledAt` as nullable meeting document field

- Decision: Add `cancelledAt: string | null` to the group meeting document, defaulting to `null`, and set it to an ISO timestamp on successful cancellation.
- Rationale: `cancelledAt` gives an auditable marker for when cancellation occurred and supports present/future UI messaging without extra event tables.
- Alternatives considered:
  - Reuse `updatedAt` as cancellation timestamp. Rejected because many edits can change `updatedAt`, making cancellation timing unreliable.
  - Store a boolean `isCancelled`. Rejected because timestamp plus status is richer and avoids adding two separate cancellation flags.

## Decision 3: Keep canceled meetings in existing query paths

- Decision: Keep canceled meetings included in standard meeting queries (list/detail/my meetings) under the same endpoint families and serializers.
- Rationale: Requirement explicitly says canceled meetings should be queried like any other meeting; this avoids separate canceled-only routes and keeps pagination behavior stable.
- Alternatives considered:
  - Filter canceled meetings from defaults and add opt-in query params. Rejected because it violates the stated product rule and increases query complexity.
  - Move canceled meetings to archival collections. Rejected because it complicates reads and lifecycle joins without feature need.

## Decision 4: Enforce canceled-state restrictions in both server and client

- Decision: Block edit, publish, and check-in operations for canceled meetings at service/route validation and mirror this in frontend derived-state/action visibility.
- Rationale: UI-only restrictions are insufficient; server-side guards prevent stale clients or crafted requests from mutating canceled meetings.
- Alternatives considered:
  - Frontend-only disablement. Rejected for security and consistency reasons.
  - Backend-only enforcement with unchanged UI. Rejected because users need clear affordance changes and explanatory states.

## Decision 5: Introduce dedicated canceled visual tone (dark orange + gray)

- Decision: Add a canceled display tone in derived meeting UI state and map it to dark orange and gray card/button/badge styles while preserving contrast and existing layout patterns.
- Rationale: The feature requires canceled meetings to be visually distinct. Derived-state ownership keeps this styling centralized and reusable between feed item and related views.
- Alternatives considered:
  - Reuse existing red tone. Rejected because requirement explicitly asks for dark orange and gray theming.
  - Theme only one component (feed) and leave others unchanged. Rejected because canceled semantics should remain consistent across meeting surfaces.

## Decision 6: Place cancellation actions where publish actions already exist

- Decision: Surface cancel actions only in the two established publish entry points: feed-item dropdown and meeting form publish/cancel card area.
- Rationale: This aligns with the requested interaction model and avoids introducing new top-level action surfaces.
- Alternatives considered:
  - Add a separate cancellation panel elsewhere in meeting pages. Rejected as unnecessary UX expansion for this feature.
  - Keep form TODO placeholder without wiring to mutation. Rejected because the feature explicitly requires replacing publish card behavior for published meetings.
