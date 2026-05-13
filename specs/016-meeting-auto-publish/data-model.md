# Data Model: Meeting Auto Publish

## Entity: ScheduledMeetingPublicationCandidate

- Purpose: In-memory representation of a draft meeting eligible for publish evaluation in the current scheduler tick.
- Source fields:
  - `meetingId`
  - `groupId`
  - `status`
  - `occursAt`
  - `publishHoursBefore`
  - `publishEmailMessage`
- Derived fields:
  - `publishAtComputed = occursAt - publishHoursBefore`
  - `dueWindowStart = now - 20 minutes`
- Eligibility rules:
  - `status` must be `draft`.
  - `cancelledAt` must be null/absent.
  - `publishAtComputed` must be between `dueWindowStart` and `now`.

## Entity: PublishScheduledMeetingResult

- Purpose: Service return envelope for one attempted meeting publish.
- Fields:
  - `meetingId`
  - `groupId`
  - `published` (boolean)
  - `reason` (`published` | `not_due` | `already_published` | `cancelled` | `skipped` | `error`)
  - `publishedAt` (ISO string | null)
  - `recipientCount`
  - `attendeeCreatedCount`
  - `emailSentCount`
  - `errorMessage` (optional)
- Rules:
  - Service returns this object and does not emit terminal logs.
  - Job layer logs result summaries.

## Entity: ActiveGroupPublicationRecipient

- Purpose: Group member target used for both publish emails and attendee creation.
- Source fields:
  - `memberId`
  - `userId` (optional)
  - `email` (if present)
  - `status`
- Eligibility rule:
  - Include members where `status` is not `cancelled` and not `removed`.

## Entity: MeetingAttendeeInvitation

- Purpose: Attendance row created at publish time for each active recipient.
- Fields:
  - `meetingId`
  - `memberId`
  - `status = invited`
  - timestamps (`createdAt`, `updatedAt`)
- Constraint:
  - Uniqueness on `(meetingId, memberId)` must prevent duplicates across retries.

## Entity: ScheduledPublishBatchResult

- Purpose: Aggregate return envelope for one scheduler execution.
- Fields:
  - `startedAt` (ISO)
  - `finishedAt` (ISO)
  - `windowMinutes` (number, fixed 20)
  - `candidateCount`
  - `publishedCount`
  - `skippedCount`
  - `errorCount`
  - `meetingResults: PublishScheduledMeetingResult[]`
- Usage:
  - Returned by top-level service orchestration.
  - Logged by job runner in terminal.

## State Transitions

- `draft -> published`:
  - Triggered by scheduled publish service when meeting is due.
  - Sets status to `published` and updates timestamps.
- `published` side effects:
  - Active members receive publish email using `publishEmailMessage` template text.
  - Active members get `meetingAttendees` row with `status = invited`.
- terminal/ignored states:
  - `cancelled` meetings are skipped.
  - Already `published` meetings are skipped idempotently.
