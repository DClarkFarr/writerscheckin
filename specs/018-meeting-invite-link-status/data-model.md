# Data Model: Meeting Invite Link Status

## Entity: InviteLinkAccessState

- Purpose: Canonical status resolved when a user opens a meeting invite link.
- Enum values:
  - `active_member`
  - `pending_invite`
  - `not_invited`
  - `declined_or_left`
  - `removed`
  - `unknown_or_expired`
- Invariant:
  - Exactly one state is resolved for each invite-link request.

## Entity: InviteLandingContext

- Purpose: UI payload returned for invite-link screen rendering regardless of non-active status.
- Fields:
  - `groupId: string`
  - `groupName: string`
  - `groupDescription: string`
  - `meetingId: string`
  - `meetingTitle?: string`
  - `accessState: InviteLinkAccessState`
  - `messageKey: string` (status-aware content key)
  - `availableActions: InviteLandingAction[]`
- Invariant:
  - `groupName` and `groupDescription` are always present when access state is not `active_member`.

## Entity: InviteLandingAction

- Purpose: User actions available from the invite landing state.
- Enum values:
  - `accept_invite`
  - `decline_invite`
  - `request_to_join`
  - `none`
- Rules:
  - `pending_invite` exposes `accept_invite` and `decline_invite`.
  - `declined_or_left` and `removed` expose `request_to_join`.
  - `not_invited` may expose `none` (informational only) unless product enables requests for that state.

## Entity: MembershipDecision

- Purpose: Mutation payload and outcome for accept/decline actions.
- Fields:
  - `groupId: string`
  - `userId: string`
  - `decision: "accept" | "decline"`
  - `updatedState: InviteLinkAccessState`
  - `effectiveAt: string` (ISO timestamp)
- Invariant:
  - Decision transitions only from `pending_invite`.

## Entity: JoinRequest

- Purpose: User-submitted reinvite request for declined/left/removed outcomes.
- Fields:
  - `groupId: string`
  - `meetingId: string`
  - `requesterUserId: string`
  - `requesterEmail: string`
  - `requesterDisplayName?: string`
  - `recipientAdminUserId: string`
  - `recipientAdminEmail: string`
  - `createdAt: string` (ISO timestamp)
- Invariant:
  - `requesterEmail` and `recipientAdminEmail` must be non-empty prior to notification dispatch.

## Entity: JoinRequestEmailPayload

- Purpose: Render contract for admin notification generated from `request_to_join` action.
- Fields:
  - `to: string` (responsible admin email)
  - `subject: string`
  - `requesterEmail: string`
  - `groupName: string`
  - `meetingReference: string`
  - `requestLink?: string`
- Invariant:
  - Includes requester identity and target group/meeting context for every successful submission.

## State Transitions

- `pending_invite` + `accept_invite` -> `active_member`
- `pending_invite` + `decline_invite` -> `declined_or_left`
- `declined_or_left` + `request_to_join` -> `declined_or_left` (membership unchanged; notification sent)
- `removed` + `request_to_join` -> `removed` (membership unchanged; notification sent)

## Validation Rules

- Invite-link state resolution uses direct lookup semantics by `groupId` + `userId` to avoid list-limit false negatives.
- Known non-active authorization outcomes are represented as renderable states, not generic untyped exceptions.
- Join request submission fails with explicit user-facing message if recipient admin email cannot be resolved.
- Retry behavior for invite-link status query is disabled or constrained for known authorization outcomes to prevent repeated red-error loops.
