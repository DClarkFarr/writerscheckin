# Data Model: Join Group Invite

## Entity: GroupInviteAccess

Represents an invite link context resolved by `membershipId` + `inviteToken`.

Fields:

- membershipId: string
- inviteToken: string (signed token from email link)
- tokenIssuedAt: string (ISO timestamp, derived from invite creation/signing payload)
- tokenValid: boolean

Validation and invariants:

- `inviteToken` must verify against server signing secret and membership payload.
- Token validation failure yields non-actionable invite state.
- Token is required for all public invite read/respond operations.

## Entity: GroupInviteView

Public-facing invite detail payload for join page.

Fields:

- membershipId: string
- groupId: string
- groupName: string
- address: string
- nextMeetingStartsAt: string | null
- invitedEmailMasked: string | null
- invitedAt: string | null
- status: "pending" | "accepted" | "declined" | "expired" | "invalid"
- canAccept: boolean
- canDecline: boolean

Derived rules:

- `status=pending` when membership status is `invited` and token is valid.
- `status=accepted|declined` when membership already handled.
- `status=invalid|expired` for bad token or unavailable invite.
- `canAccept` and `canDecline` are false for non-pending states.

## Entity: InviteResponseRequest

Action payload from join page.

Fields:

- membershipId: string
- inviteToken: string
- action: "accept" | "decline"

Validation:

- `action=decline` requires valid token and pending membership.
- `action=accept` requires valid token, pending membership, and authenticated user identity matching membership user/email binding.

## Entity: InviteResponseResult

Outcome of action request used by join page and post-login continuation.

Fields:

- membershipId: string
- groupId: string
- status: "accepted" | "declined"
- actedAt: string (ISO timestamp)
- redirectTo: string

Behavioral rules:

- `accept` returns `redirectTo: "/"` for this feature.
- `decline` returns `redirectTo: ""` (caller remains on invite page with updated status view).

## Entity: InviteActionSessionState

Client state used to resume pending accept after authentication.

Fields:

- pendingAction: "accept" | null
- pendingMembershipId: string | null
- pendingInviteToken: string | null
- requiresLoginModal: boolean

State transitions:

- Idle -> AwaitingAuth when signed-out user clicks Join.
- AwaitingAuth -> Accepting after login success callback.
- Accepting -> Completed after accept success and redirect to `/`.
- AwaitingAuth -> Idle when login modal closes/cancels.
