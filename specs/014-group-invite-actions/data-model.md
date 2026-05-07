# Data Model: Group Invite Actions

## Entity: GroupInviteMembership

Represents a user-facing pending/handled invite row sourced from `groupMembers` and projected with related group details.

Fields:

- membershipId: string
- groupId: string
- userId: string | null
- email: string
- role: "owner" | "admin" | "member"
- status: "invited" | "accepted" | "declined" | "cancelled" | "removed"
- createdAt: string (ISO timestamp)
- invitedAt: string | null
- acceptedAt: string | null

Validation and invariants:

- User self-response is allowed only when current status is `invited`.
- Valid transitions for this feature:
  - `invited -> accepted`
  - `invited -> declined`
- Invalid or duplicate transitions return a user-facing error and trigger cache refresh.

## Entity: GroupInviteSummaryItem

Presentation model for invite list rows on My Groups tab, composed from `GroupSummaryItem` plus membership metadata.

Fields:

- groupId: string
- groupName: string
- address: string
- nextMeetingStartsAt: string | null
- inviteCreatedAt: string
- membershipId: string
- membershipStatus: "invited"

Derived rules:

- List only rows where membership status is `invited`.
- Sort by `inviteCreatedAt` descending.
- Count badge = number of currently rendered pending invite rows in canonical cache result.

## Entity: InviteActionRequest

Client mutation payload for responding to a pending invite.

Fields:

- membershipId: string
- action: "accept" | "decline"

Validation:

- `membershipId` must be a valid record for authenticated user.
- `action` must map to allowed status transitions.

## Entity: InviteActionResult

Server response and frontend mutation output for invite response.

Fields:

- membershipId: string
- groupId: string
- status: "accepted" | "declined"
- actedAt: string (ISO timestamp)
- redirectTo: string | null (non-null when status is `accepted`)

Behavioral rules:

- `accepted` returns redirect target to group view page.
- `declined` returns `redirectTo: null`.

## Query Cache Models

## Cache Key: `myGroupQueryKey("invited")`

- Contains pending invite rows used by:
  - home tab badge
  - Group Invites list card

## Cache Key: `myGroupQueryKey("accepted")`

- Contains regular My Groups tab cards.
- Accept action may insert/refresh accepted group membership data.

## Cache Key: `myMeetingsQueryKey()`

- Meeting feed eligibility changes when invite becomes accepted.
- Must be invalidated after invite accept/decline settles.
