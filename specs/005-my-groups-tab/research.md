# Research: My Groups Tab and Group Management Flows

## Decision 1: Infinite scrolling strategy for My Groups

- Decision: Use cursor-based pagination with TanStack Query `useInfiniteQuery` for the My Groups list.
- Rationale: Cursor pagination avoids duplicate/skip risk during mutable datasets and maps naturally to append-only infinite scrolling UX.
- Alternatives considered:
  - Offset-based pagination: simpler but more prone to inconsistency when group membership changes between fetches.
  - Traditional numbered pages: violates the requested infinite scrolling interaction.

## Decision 2: Group card summary payload shape

- Decision: Provide a backend summary DTO per group including recurrence, active member count, invited member count, past meetings count, and optional next upcoming meeting metadata.
- Rationale: Keeps the UI lightweight and avoids N+1 query behavior in the client.
- Alternatives considered:
  - Compute all counts client-side from separate APIs: higher request volume and slower first meaningful render.
  - Return only base group fields and lazy-load each metric: slower and visually unstable cards.

## Decision 3: Create/Edit group form architecture

- Decision: Follow constitution hook/component split with `useGroupForm` owning validation/mutations and `GroupForm` as pure presentational UI.
- Rationale: Aligns with established form architecture and improves testability/reuse for both create and edit flows.
- Alternatives considered:
  - Single page component containing state + JSX: faster initially but violates project form architecture principles.

## Decision 4: Rich text behavior for group description

- Decision: Reuse existing TipTap-based `RichTextEditor` in basic mode for description field editing.
- Rationale: Satisfies requirement while avoiding a second editor stack.
- Alternatives considered:
  - Plain textarea only: misses requested rich-text editing behavior.
  - Introduce a new editor library: unnecessary dependency and inconsistent UX.

## Decision 5: Admin/member participant selector

- Decision: Use `react-select` multi-select with custom option and value rendering for avatar + name, with selected participants mirrored below as list items.
- Rationale: Explicitly matches requirement for searchable multi-select behavior and custom avatar/name rendering.
- Alternatives considered:
  - shadcn `Command` + `Popover` custom implementation: feasible, but higher build complexity for parity with requested interaction model.

## Decision 6: Canonical route mapping

- Decision: Implement canonical routes exactly as required: `/groups/create`, `/groups/:groupId/edit`, and `/groups/:groupId/meetings/:meetingId/edit`.
- Rationale: Deterministic deep links and explicit alignment with requested URL contract.
- Alternatives considered:
  - `/groups/new` style alias: readable but conflicts with the requested canonical structure.

## Decision 7: Upcoming meeting creation flow

- Decision: Add a dedicated backend operation to create an upcoming meeting from group defaults and return `{ groupId, meetingId, redirectTo }` for immediate navigation.
- Rationale: Centralizes default-copying rules in backend service layer and ensures redirect target consistency.
- Alternatives considered:
  - Frontend composes meeting payload and posts generic create request: duplicates business logic client-side and risks drift.

## Decision 8: Activation/deactivation actions

- Decision: Expose a backend state transition endpoint that only accepts legal active/inactive transitions and returns updated action eligibility.
- Rationale: Prevents stale UI assumptions and race-condition errors.
- Alternatives considered:
  - Blind PATCH to group document from frontend: weaker guardrails and brittle conflict handling.
