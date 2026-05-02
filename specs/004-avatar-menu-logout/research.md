# Research: Avatar Menu Logout

## Decision 1: Use shadcn Avatar + DropdownMenu Composition

- Decision: Implement the authenticated top-bar control as a shadcn Avatar trigger wrapped by `DropdownMenu`, with structured `DropdownMenuContent`, identity section, separator, and logout action item.
- Rationale: This aligns with existing shadcn/Radix behavior in the codebase and preserves keyboard/focus/dismiss interactions without custom menu state logic.
- Alternatives considered: Popover-based menu was considered but rejected because it would require more manual keyboard/accessibility behavior for equivalent outcomes.

## Decision 2: Keep Logout API and Session Flow Unchanged

- Decision: Reuse the existing logout action and signed-out redirect/session invalidation behavior, changing only where the action is surfaced in UI.
- Rationale: The feature is a placement and interaction redesign, not an authentication contract change; preserving behavior minimizes regression risk.
- Alternatives considered: Introducing a new account-menu-specific logout endpoint was rejected as unnecessary and out of scope.

## Decision 3: Deterministic Avatar Fallback Using User Identity

- Decision: Render user avatar image when available; otherwise render deterministic initials fallback based on user name data.
- Rationale: Deterministic fallback supports recognition and avoids blank/non-informative triggers when image data is missing.
- Alternatives considered: Generic icon-only fallback was rejected due to lower account recognizability.

## Decision 4: Grouped Dropdown Layout for Future Account Links

- Decision: Separate the dropdown into an identity header section and action items section so future links can be inserted without altering identity/logout semantics.
- Rationale: This satisfies extensibility requirement (FR-010) and keeps destructive/terminal actions visually distinct.
- Alternatives considered: Flat single-list menu was rejected because it makes future growth harder and weakens section clarity.

## Decision 5: Verify Behavior with Layered Frontend Checks

- Decision: Validate with static checks (`web` lint/build), component/integration interaction checks (open/close, escape, outside click), and end-to-end manual logout flow verification.
- Rationale: The feature risk is primarily interaction regression in authenticated UI; layered checks detect both compile-time and behavior issues.
- Alternatives considered: Static checks alone were rejected because they cannot confirm runtime menu interactions or session transition UX.
