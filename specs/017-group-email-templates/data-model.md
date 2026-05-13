# Data Model: Group Email Templates and Check-In UX

## Entity: GroupEmailTemplateDefaults

- Purpose: Persisted group-level source templates used for meeting inheritance and form editing.
- Storage:
  - `groups.publishEmailMessage` (HTML-compatible string)
  - `groups.attendanceEmailMessage` (HTML-compatible string)
- Defaulting rules:
  - If `publishEmailMessage` is empty/missing on group query, set to publish baseline template.
  - If `attendanceEmailMessage` is empty/missing on group query, set to `TODO: add template here`.
- Invariant:
  - Non-empty string values after read-defaulting.

## Entity: MeetingEmailTemplate

- Purpose: Meeting-scoped template values editable independently from group defaults.
- Storage:
  - `groupMeetings.publishEmailMessage`
  - `groupMeetings.attendanceEmailMessage`
- Inheritance rules:
  - On meeting creation from group defaults, copy both fields from group.
  - After copy, meeting edits do not mutate group values.

## Entity: ShortcodeToken

- Purpose: Placeholder markers authored in template body and resolved at email render time.
- Supported tokens:
  - `[meetingName]`
  - `[meetingDate]`
  - `[meetingTime]`
  - `[meetingAddress]`
  - `[dateOfNotification]`
  - `[checkinButton]`
- Rules:
  - Tokens are case-sensitive bracketed strings.
  - Unknown tokens are left unchanged.

## Entity: PublishEmailRenderContext

- Purpose: Runtime inputs used to parse a meeting template into final email output.
- Fields:
  - `meetingName: string`
  - `meetingDateText: string`
  - `meetingTimeText: string`
  - `meetingAddress: string`
  - `dateOfNotificationText: string`
  - `meetingUrl: string`
- Derived values:
  - `resolvedBodyHtml`
  - `resolvedBodyText`

## Entity: CheckinButtonFragment

- Purpose: CTA fragment replacing `[checkinButton]` in HTML output.
- Fields:
  - `label = check in`
  - `href = meetingUrl`
  - themed button styles from base email components
- Constraint:
  - Must appear after main message body content in final render order.

## Entity: MeetingDetailsCheckinState

- Purpose: Client-side check-in controls rendered in meeting details view.
- Source fields:
  - `meeting.canCheckin`
  - `meeting.userCheckinState`
  - existing mutation response from check-in endpoint
- States:
  - `attending`
  - `reading`
  - `not_attending`
  - `none` (invited/unselected)
- Behavior:
  - Actions and disabled rules mirror meeting card check-in behavior.

## Validation Rules

- Rich text template values must be storable as strings and accepted by existing API contracts.
- Group defaulting updates only run when values are missing/empty; existing non-empty values are preserved.
- Meeting template inheritance occurs at meeting creation time only.
- Publish email renderer must always produce both `html` and `text` outputs.
