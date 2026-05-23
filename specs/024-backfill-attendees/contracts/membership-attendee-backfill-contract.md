# Contract: Membership Activation Attendee Backfill

## Scope

Defines required backend side effects when a membership becomes accepted after meetings already exist.

## Trigger Points

Backfill is executed when a group membership transitions to accepted in any of these flows:

- POST /api/groups/members/:membershipId/respond (accept)
- POST /api/group-invites/:membershipId/respond (accept)
- POST /api/group-invites/meeting-links/respond (decision=accept)
- POST /api/auth/signup (when invited memberships are auto-attached and accepted)
- Service-level accepted member creation paths (for example admin/member creation with status=accepted)

Implemented service coverage:

- `respondToGroupInvite()` in `express/src/services/groupMembersService.ts`
- `respondToJoinGroupInvite()` in `express/src/services/groupInvitesService.ts`
- `respondToMeetingInviteDecision()` in `express/src/services/groupInvitesService.ts`
- `attachUserToInvitedMembers()` in `express/src/services/groupMembersService.ts`
- `addGroupMember()` when resulting status is accepted in `express/src/services/groupMembersService.ts`

## Preconditions

1. Membership exists.
2. Resulting membership status is accepted.
3. Membership is tied to a concrete member record identifier used by meetingAttendees.memberId.

## Candidate Meeting Selection

For the membership's group, evaluate meetings that are eligible for member participation under existing rules.

- Preserve existing publish/cancel eligibility semantics.
- Do not introduce a second eligibility source.

Implemented selection helper:

- `listEligiblePublishedMeetingsForMembershipBackfill()` in `express/src/models/groupMeetings.ts`
- Current filter semantics: `status = "published"` and `cancelledAt = null`

## Backfill Operation

For each candidate meeting:

1. Call createMeetingAttendeeIfMissing with:
   - meetingId = candidate meeting id
   - memberId = membership id
   - status = invited
2. Track whether attendee was created vs already existed.

Implemented utility:

- `backfillMeetingAttendeesForAcceptedMembership()` in `express/src/services/groupMembersService.ts`
- Returns internal metrics: evaluated count, created count, existing count

## Idempotency and Concurrency

- Unique index on (meetingId, memberId) is authoritative.
- Repeated triggers must not create duplicates.
- Concurrent triggers resolve via duplicate-safe createMeetingAttendeeIfMissing behavior.

## Response Contract Impact

- Existing endpoint response shapes remain unchanged.
- Backfill is an internal consistency side effect.

## Failure Modes

- Membership not found: existing endpoint/service error behavior remains unchanged.
- Partial attendee creation failure: request should fail through existing error handling, preserving consistency guarantees from current service behavior.

## Invariants

1. One attendee row per user-meeting pair at most.
2. Accepted members can see and interact with eligible meetings under existing rules.
3. No new background jobs, no schema additions, and no endpoint shape changes are required for this feature.
