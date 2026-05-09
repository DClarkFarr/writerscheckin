# Quickstart: Join Group Invite

## Goal

Ship an email-driven join invite page that is public-readable, supports signed-out decline with confirmation, and supports signed-out accept via login modal with automatic continuation and home redirect.

## Implementation Steps

1. Backend invite link generation and token strategy

- Update invite email template pipeline to generate invite URLs using `membershipId` + signed `inviteToken`.
- Keep token generation/verification in service layer and avoid router-level crypto logic.

2. Backend public invite endpoints

- Add `GET /api/group-invites/:membershipId` for invite page detail state.
- Add `POST /api/group-invites/:membershipId/respond` for accept/decline.
- Enforce rules:
  - decline works with token alone
  - accept requires authenticated ownership match

3. Frontend routing and auth redirect strategy

- Add a pathless public route segment and implement join page route (for example `/join/$membershipId`).
- Replace `RootLayout` literal `nonAuthPaths` check with `isPublicPath` helper supporting dynamic prefixes (`/join/`).
- Keep redirects for protected routes on auth failures.

4. Join page UI and flow orchestration

- Build join invite page with pending/non-pending status views and group details.
- Add Decline confirmation dialog before mutate.
- Add Join behavior:
  - signed-in: call accept and redirect to `/`
  - signed-out: open login modal, then auto-accept on login success and redirect

5. API client and query hooks

- Add invite read/respond functions in `web/src/api/`.
- Add query/mutation hooks in `web/src/queries/` and keep query key ownership in hook modules.
- Use targeted invalidation for home groups/meetings data after accepted join.

6. Reuse login form in modal context

- Reuse existing login form + hook contract using callback for success.
- Ensure modal close cancels pending accept continuation safely.

## Manual Verification Checklist

1. Public access and status rendering

- Open valid invite link while signed out.
- Confirm invite details render and no forced redirect to `/login`.
- Open invalid/expired link and confirm non-actionable state message.

2. Decline while signed out

- Click Decline and verify confirmation modal appears.
- Confirm decline; verify invite view updates to declined status.
- Reload link and verify declined state persists.

3. Accept while signed in

- Open valid invite while signed in.
- Click Join Group; verify accept succeeds and redirect goes to `/`.

4. Accept while signed out with modal login

- Open valid invite while signed out.
- Click Join Group; verify login modal appears.
- Complete login; verify accept runs automatically and redirect goes to `/`.

5. Redirect guard regression checks

- Visit a protected route while signed out and verify redirect still goes to `/login`.
- Visit public join route while signed out and verify no redirect occurs.
