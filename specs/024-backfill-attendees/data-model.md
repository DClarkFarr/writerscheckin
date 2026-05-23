# Data Model: Backfill Meeting Attendees

## Entity: GroupMember

- Purpose: Represents a user's membership in a group and is the source event for backfill when status becomes accepted.
- Relevant fields:
  - \_id
  - groupId
  - userId
  - email
  - role
  - status (invited | accepted | declined | removed | cancelled)
  - acceptedAt
- Validation rules:
  - Backfill runs only when resulting status is accepted.
  - userId must exist for user-scoped meeting visibility paths.

## Entity: GroupMeeting

- Purpose: Source set of meetings to evaluate for attendee backfill in the member's group.
- Relevant fields:
  - \_id
  - groupId
  - status
  - occursAt
  - cancelledAt
- Validation rules:
  - Candidate meetings must satisfy existing participation eligibility rules for member-facing meetings.

## Entity: MeetingAttendee

- Purpose: Participation row used by My Meetings and attendee interactions.
- Relevant fields:
  - \_id
  - meetingId
  - memberId
  - status (default invited when backfilled)
  - createdAt
  - updatedAt
  - changedBy (optional)
  - isAdminOverride (optional)
- Validation rules:
  - Unique key on (meetingId, memberId) must be preserved.
  - Backfill must be idempotent and never create duplicates.

## Entity: MembershipActivationBackfillResult

- Purpose: Internal service result for observability and testing.
- Fields:
  - membershipId
  - groupId
  - evaluatedMeetingCount
  - attendeeCreatedCount
  - attendeeExistingCount

## State Transitions

1. Membership invited -> accepted
   - Trigger: invite acceptance, join acceptance, member attach on signup, or accepted add flow.
   - Result: eligible meetings are evaluated and missing MeetingAttendee rows are created.

2. Membership already accepted -> accepted
   - Trigger: idempotent retries or repeated activation path.
   - Result: no duplicate rows; only missing attendee rows are inserted.
