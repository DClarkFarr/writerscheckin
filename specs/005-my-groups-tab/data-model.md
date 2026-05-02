# Data Model: My Groups Tab and Group Management Flows

## Entity: MyGroupListItem

- Purpose: Read model for each group card in My Groups tab.
- Fields:
  - `groupId` (string)
  - `name` (string)
  - `descriptionPreview` (string | null)
  - `recurrence` (enum/string from group recurrence model)
  - `isActive` (boolean)
  - `activeMemberCount` (number)
  - `invitedMemberCount` (number)
  - `pastMeetingCount` (number)
  - `nextUpcomingMeeting` (object | null)
  - `nextUpcomingMeeting.meetingId` (string)
  - `nextUpcomingMeeting.startsAt` (ISO datetime)
  - `availableActions` (object)
  - `availableActions.canActivate` (boolean)
  - `availableActions.canDeactivate` (boolean)
  - `availableActions.canViewUpcomingMeeting` (boolean)
  - `availableActions.canCreateManualMeeting` (boolean)
- Validation rules:
  - Counts are non-negative integers.
  - Exactly one of `canActivate` / `canDeactivate` is true.
  - Exactly one of `canViewUpcomingMeeting` / `canCreateManualMeeting` is true.

## Entity: GroupFormDraft

- Purpose: Mutable create/edit form state used by UI and API payload mapping.
- Fields:
  - `name` (string)
  - `description` (rich text JSON/string payload in basic mode)
  - `address` (string)
  - `startTime` (HH:mm or domain-specific local time representation)
  - `durationMinutes` (number)
  - `recurrence` (domain recurrence payload)
  - `publicMessage` (string)
  - `attendanceMessage` (string)
  - `adminUserIds` (string[])
  - `memberUserIds` (string[])
- Validation rules:
  - `name` required, trimmed, non-empty.
  - `durationMinutes` must satisfy domain scheduling constraints.
  - `adminUserIds` and `memberUserIds` contain unique user IDs per list.
  - Owner/permission invariants enforced at service layer.

## Entity: SelectableParticipantSummary

- Purpose: Search result option for admin/member multi-select controls.
- Fields:
  - `userId` (string)
  - `displayName` (string)
  - `avatarUrl` (string | null)
  - `email` (string)
  - `eligibleRoles` (string[])
- Validation rules:
  - `userId` unique per result set.
  - `displayName` fallback provided when profile fields are incomplete.

## Entity: UpcomingMeetingCreationResult

- Purpose: Response model when creating an upcoming meeting from group defaults.
- Fields:
  - `groupId` (string)
  - `meetingId` (string)
  - `redirectTo` (string; canonical edit URL)
  - `createdFromDefaults` (boolean)
- Validation rules:
  - `redirectTo` must match `/groups/:groupId/meetings/:meetingId/edit`.
  - `createdFromDefaults` must be true for this operation.

## Entity Relationships

- One `Group` has many `GroupMember` rows and many `GroupMeeting` rows.
- `MyGroupListItem` derives from `Group`, `GroupMember`, and `GroupMeeting` aggregates.
- `GroupFormDraft` maps to create/update operations on `Group` and related membership assignments.
- `UpcomingMeetingCreationResult` is produced by creating one `GroupMeeting` bound to one `Group`.

## State Transitions

## Group Activation State

- `active -> inactive` via Deactivate action.
- `inactive -> active` via Activate action.
- Invalid transition (same-state request) returns domain validation error.

## Meeting Action Eligibility

- If upcoming meeting exists: `canViewUpcomingMeeting = true`, `canCreateManualMeeting = false`.
- If no upcoming meeting exists: `canViewUpcomingMeeting = false`, `canCreateManualMeeting = true`.

## Group Form Mode

- Create mode: no source group, defaults initialized.
- Edit mode: source group loaded and draft pre-populated.
- Submit mode: validated draft maps to create/update payload, then navigates to appropriate destination.
