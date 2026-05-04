# Research: My Meetings Tab

## Decision 1: Standardize meeting feed objects into one contract

- Decision: Use a single `MyMeetingFeedItem` response object for all feed rows (upcoming, upcoming-draft-admin-only, past), with explicit fields for visibility, check-in state, and visual treatment metadata.
- Rationale: A unified payload prevents frontend branching by endpoint shape and ensures consistent rendering, pagination, optimistic updates, and analytics.
- Alternatives considered: Separate upcoming and past DTOs. Rejected because it duplicates mapping logic and complicates infinite list flattening.

## Decision 2: Enforce role-aware visibility and segment ordering on the backend

- Decision: The backend composes one feed with two segments in this order: upcoming then past. For `member` role, upcoming contains only the next published upcoming meeting per group and past contains published-only history. For `owner/admin`, upcoming also includes draft meetings, with draft rows marked admin-only.
- Rationale: Visibility logic must be authoritative server-side to avoid leaks. Keeping order server-defined ensures deterministic pagination and consistent UI behavior.
- Alternatives considered: Filter drafts client-side. Rejected because sensitive rows could be exposed in transport and cache.

## Decision 3: Use optimistic updates as the default check-in mutation pattern

- Decision: Check-in changes (`attending`, `reading`, `not attending`) are handled by a dedicated mutation hook that performs optimistic cache updates in `onMutate`, rollback in `onError`, and reconciliation in `onSuccess`/`onSettled`.
- Rationale: Immediate feedback is required for a fast mobile-first interaction, and Constitution Principle XII requires hook-owned optimistic behavior.
- Alternatives considered: Wait for server response before updating badges and button labels. Rejected because it degrades responsiveness and increases repeated taps.

## Decision 4: Use a drawer for check-in choice selection

- Decision: Clicking `check in` or `update check-in` opens a bottom drawer presenting exactly three options: `attending`, `reading`, `not attending`.
- Rationale: Drawer UX fits mobile ergonomics and keeps row-level UI compact while allowing explicit state choices.
- Alternatives considered: Inline toggle buttons inside each feed row. Rejected because it increases visual density and risks accidental taps.

## Decision 5: Encode admin draft visibility in standardized display flags

- Decision: Include `isDraft`, `isAdminOnly`, and `showAdminOnlyBadge` flags in each feed item; for draft rows shown to admins/owners, render an `admin only` badge with hidden-eye icon.
- Rationale: Declarative display flags keep component logic simple and prevent role checks being spread across UI layers.
- Alternatives considered: Infer badge conditions solely from `status` and `userRole` in the component. Rejected because it couples rendering to policy logic and invites drift.
