# Research: Join Group Invite

## Decision 1: Use signed invite links instead of bare group IDs

- Decision: Replace email links with invite-scoped URLs that include `membershipId` and a signed `inviteToken`.
- Rationale: Current email links (`/join/:groupId`) cannot identify a specific invitee for unauthenticated decline. Signed invite links support invite-specific access without requiring pre-login and reduce enumeration risk versus plain IDs.
- Alternatives considered:
  - Keep `/join/:groupId` only: rejected because unauthenticated decline cannot be safely tied to one invite.
  - Put invitee email in URL query params: rejected due to PII leakage and replay concerns.

## Decision 2: Add public invite read endpoint for invite details page

- Decision: Add `GET /api/group-invites/:membershipId` with required `inviteToken` query parameter to return invite status and group details.
- Rationale: Join page must render for signed-out users, including invalid/expired/already-handled states, without redirecting to login.
- Alternatives considered:
  - Render join page from preloaded email data only: rejected because page refresh/deep links require server-backed resolution.
  - Reuse authenticated `/api/groups/mine` reads: rejected because signed-out users must still access details.

## Decision 3: Split invite actions by auth requirement while keeping one surface

- Decision: Add `POST /api/group-invites/:membershipId/respond` with `{ action, inviteToken }` where:
  - `decline` works with valid token and no login.
  - `accept` requires authenticated user mapped to the invite membership.
- Rationale: Matches requirement that decline works signed-out and accept from signed-out requires login completion.
- Alternatives considered:
  - Require login for both actions: rejected (violates decline requirement).
  - Allow unauthenticated accept using token only: rejected due to unsafe account-binding semantics.

## Decision 4: Adopt a reusable public route segment for unauthenticated invite pages

- Decision: Add a dedicated pathless public route segment (for example `web/src/routes/_public.tsx`) and place join invite route under it.
- Rationale: User requested support for possible future unauthenticated pages; centralizing public routes avoids one-off exceptions.
- Alternatives considered:
  - Keep adding literals into `RootLayout` `nonAuthPaths`: rejected as brittle for dynamic paths like `/join/:id` and poor for future growth.
  - Move join page into `_auth` routes: rejected because `_auth` currently represents auth screens and does not encode invite-public semantics.

## Decision 5: Refactor auth redirect allowlist to path-aware helper

- Decision: Replace strict array `includes(pathname)` checks with a shared `isPublicPath(pathname)` helper that supports exact and prefix matching.
- Rationale: Current behavior in `RootLayout` would redirect `/join/...` to `/login` on auth errors. A path-aware helper preserves public join behavior and future unauthenticated pages.
- Alternatives considered:
  - Ignore auth query errors globally: rejected because protected pages still need redirect on expired sessions.

## Decision 6: Accept flow uses login modal + deferred mutation resume

- Decision: On join page, if user clicks Join while signed out, open login modal using existing login form contract; after successful login, automatically execute pending accept mutation and redirect to `/`.
- Rationale: Reuses existing auth UX and fulfills requirement for automatic post-login acceptance in one flow.
- Alternatives considered:
  - Redirect to full `/login?redir=...`: rejected because requirement explicitly asks for modal flow.
  - Require user to click Join again after login: rejected because requirement requires automatic continuation.
