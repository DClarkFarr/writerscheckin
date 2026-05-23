# Quickstart: Backfill Meeting Attendees

## Overview

This feature ensures users can see and interact with eligible meetings when they become group members after meetings were already published.

Implementation is intentionally minimal:

- trigger attendee backfill only when membership becomes accepted
- use existing createMeetingAttendeeIfMissing idempotency
- avoid new jobs, schema changes, and API shape changes

## Affected Flows

- Accept membership invite via groups endpoint
- Accept invite via group-invite link endpoint
- Accept meeting-link invite endpoint
- Signup flow that auto-attaches invited memberships
- Any accepted-member creation path that bypasses invite response

## Validation Checklist

1. Invite acceptance after publication:
   - Create/publish a meeting.
   - Accept invite afterward.
   - Confirm meeting appears in My Meetings.
   - Confirm exactly one meetingAttendees row exists for membership + meeting.

2. Admin adds member after publication:
   - Publish a meeting first.
   - Add member via group member management flow.
   - Confirm meeting appears in My Meetings and attendee row is created.

3. Idempotency:
   - Re-run the same acceptance/activation action where possible.
   - Confirm no duplicate meetingAttendees rows are created.

4. Behavior parity:
   - Open backfilled meeting and perform normal attendee interactions.
   - Confirm existing permissions/timing rules are unchanged.

## Execution Evidence Matrix

| Story | Scenario                                                                         | Status                           | Notes                                                   |
| ----- | -------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| US1   | Accept membership after published meeting exists; meeting appears in My Meetings | Code complete, manual QA pending | Backfill wired in acceptance services                   |
| US1   | Add accepted member after publication; meeting appears in My Meetings            | Code complete, manual QA pending | Backfill wired in accepted add flow                     |
| US2   | Re-run acceptance path; no duplicate attendee rows                               | Code complete, manual QA pending | Uses createMeetingAttendeeIfMissing + unique index      |
| US2   | Multiple eligible meetings backfilled for one accepted member                    | Code complete, manual QA pending | Eligible published meetings iterated in service utility |
| US3   | Backfilled meeting supports standard attendee actions                            | Code verified, manual QA pending | API/query normalization and check-in flow reviewed      |

## Current Verification Outcomes

- Implemented reusable membership backfill utility in `express/src/services/groupMembersService.ts`.
- Implemented eligible candidate meeting helper in `express/src/models/groupMeetings.ts`.
- Wired acceptance triggers in:
  - `respondToGroupInvite()`
  - `respondToJoinGroupInvite()`
  - `respondToMeetingInviteDecision()`
  - `attachUserToInvitedMembers()`
  - `addGroupMember()` accepted path
- Backend compile/type validation:
  - `cd express && npx tsc --noEmit` passed
  - `cd express && npm run build` passed
- Frontend type validation:
  - `cd web && npx tsc -b` passed
- US3 code-path verification:
  - member meeting response mapping preserves attendee payloads in `express/src/services/groupMeetingsService.ts`
  - invited/backfilled attendee transition path supported in `express/src/services/meetingCheckinService.ts`
  - attendance normalization and cache handling accept null or valid attendee payloads in `web/src/api/groups.ts` and `web/src/queries/useMyMeetingsQuery.ts`

## Suggested Commands

- Backend typecheck: cd express && npx tsc --noEmit
- Backend build: cd express && npm run build
- Frontend typecheck: cd web && npx tsc -b

## Notes

- If visibility is still missing after backend backfill, investigate frontend filtering as a separate follow-up, not as part of the minimal backfill scope.
