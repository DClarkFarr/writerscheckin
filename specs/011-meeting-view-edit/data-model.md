# Data Model: Meeting View And Edit

## Entities

### MeetingDetailView

Member-facing payload used by the view page.

| Field              | Type                                                  | Notes                                                    |
| ------------------ | ----------------------------------------------------- | -------------------------------------------------------- |
| `meetingId`        | string                                                | Stable meeting identifier.                               |
| `groupId`          | string                                                | Parent group identifier used for routes and breadcrumbs. |
| `groupName`        | string                                                | Group label for header context.                          |
| `name`             | string                                                | Meeting display title.                                   |
| `occursAt`         | string (ISO)                                          | Canonical occurrence timestamp.                          |
| `address`          | string                                                | Displayed on the summary page.                           |
| `description`      | string                                                | Displayed on the summary page.                           |
| `startTime`        | `{ hours: number; minutes: number }`                  | Reuses meeting model time-of-day shape.                  |
| `durationMinutes`  | number                                                | Display-only in the member view.                         |
| `status`           | `draft` \| `published`                                | Draft visible only to admins/owners.                     |
| `userCheckinState` | `attending` \| `reading` \| `not_attending` \| `none` | Signed-in user's current attendance state.               |
| `canCheckin`       | boolean                                               | True only for eligible upcoming meetings.                |
| `canEdit`          | boolean                                               | True only for admins and owners.                         |
| `participantRows`  | `MeetingParticipantRow[]`                             | Member attendance list for the page body.                |
| `attendingCount`   | number                                                | Aggregate count shown in the page header.                |
| `readingCount`     | number                                                | Aggregate count shown in the page header.                |

Validation rules:

- `canEdit=false` for non-admin members even when the user can view the page.
- `userCheckinState=none` is valid when the user has not responded yet.
- `participantRows` must include a deterministic order so the page does not reshuffle on refetch.

### EditableMeetingForm

Admin-facing payload used by the edit page and autosave form.

| Field                         | Type                                 | Notes                                                          |
| ----------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `meetingId`                   | string                               | Stable identifier.                                             |
| `groupId`                     | string                               | Parent group identifier.                                       |
| `name`                        | string                               | Required editable field.                                       |
| `occursAt`                    | string (ISO)                         | Editable occurrence timestamp.                                 |
| `description`                 | string                               | Editable long text.                                            |
| `address`                     | string                               | Editable location field.                                       |
| `startTime`                   | `{ hours: number; minutes: number }` | Editable time-of-day.                                          |
| `durationMinutes`             | number                               | Must respect existing duration validation.                     |
| `publishEmailMessage`         | string                               | Admin-only message field.                                      |
| `attendanceEmailMessage`      | string                               | Admin-only message field.                                      |
| `publishHoursBefore`          | number                               | Controls automatic publish timing helper text.                 |
| `notifyAttendanceHoursBefore` | number                               | Attendance reminder timing.                                    |
| `status`                      | `draft` \| `published`               | Drives publish CTA visibility.                                 |
| `publishScheduledFor`         | string \| null                       | Derived next automatic publish timestamp shown as helper text. |
| `canPublishNow`               | boolean                              | True only when `status=draft`.                                 |
| `savedAt`                     | string \| null                       | Latest confirmed autosave timestamp.                           |

Validation rules:

- Omit unchanged optional patch keys instead of sending `undefined` values.
- `publishHoursBefore` and `notifyAttendanceHoursBefore` are non-negative integers.
- `durationMinutes` and `startTime` reuse current model validation constraints.

### MeetingParticipantRow

Per-member attendance record shown in the detail page list.

| Field              | Type                                                              | Notes                                                   |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `memberId`         | string                                                            | Group member identifier.                                |
| `userId`           | string \| null                                                    | Present when member is linked to a user account.        |
| `displayName`      | string                                                            | Rendered in participant list.                           |
| `avatarUrl`        | string \| null                                                    | Existing avatar field.                                  |
| `role`             | `owner` \| `admin` \| `member`                                    | Group role for context.                                 |
| `membershipStatus` | `accepted` \| `invited` \| `declined` \| `cancelled` \| `removed` | Current group membership state.                         |
| `attendanceState`  | `attending` \| `reading` \| `not_attending` \| `none`             | Meeting-specific attendance state rendered in the list. |
| `isCurrentUser`    | boolean                                                           | Helps highlight the signed-in user row if needed.       |

Validation rules:

- Rows with non-accepted membership states may still render if the product already surfaces them in meeting attendance lists, but they must never be editable here.
- `attendanceState=none` is valid for invited or not-yet-responded members.

### MeetingAutosaveResult

Server response for debounced field saves.

| Field                 | Type                   | Notes                                                       |
| --------------------- | ---------------------- | ----------------------------------------------------------- |
| `meetingId`           | string                 | Saved meeting identifier.                                   |
| `savedAt`             | string (ISO)           | Canonical save timestamp for UI feedback.                   |
| `status`              | `draft` \| `published` | Current meeting status after save.                          |
| `publishScheduledFor` | string \| null         | Recomputed automatic publish timestamp shown below the CTA. |
| `updatedFields`       | string[]               | Field names changed by this patch.                          |

### PublishMeetingResult

Server response for explicit publish action.

| Field               | Type         | Notes                                            |
| ------------------- | ------------ | ------------------------------------------------ |
| `meetingId`         | string       | Published meeting identifier.                    |
| `status`            | `published`  | Final status after publish.                      |
| `publishedAt`       | string (ISO) | Canonical publish timestamp.                     |
| `attendanceEnabled` | boolean      | Confirms members can start check-in immediately. |

## Relationships

- One `MeetingDetailView` has many `MeetingParticipantRow` entries.
- One `EditableMeetingForm` belongs to exactly one `MeetingDetailView` by `meetingId`, but contains a richer admin-only field set.
- One `MeetingAutosaveResult` updates exactly one `EditableMeetingForm` snapshot.
- One `PublishMeetingResult` transitions one `EditableMeetingForm.status` from `draft` to `published`.

## State Transitions

### Member View Flow

1. User opens the view route.
2. View query fetches `MeetingDetailView` from the member-facing endpoint.
3. Page shows breadcrumbs, summary content, the user's attendance state, and participant rows.
4. Quick check-in mutation updates `userCheckinState` and aggregate counts.
5. Refetch or cache patch keeps participant list and header state consistent.

### Admin Autosave Flow

1. Admin opens the edit route.
2. Edit query fetches `EditableMeetingForm` from the admin-only edit endpoint.
3. `useMeetingForm` tracks local field state and starts a debounce timer after changes.
4. When the debounce window expires, `useSaveMeetingMutation` patches changed fields.
5. On success, the form updates `savedAt`, helper text data, and triggers a success toast.
6. On failure, the form retains local edits, surfaces an error, and allows the next debounce cycle or retry to resubmit.

### Draft Publish Flow

1. Admin views a draft meeting in the edit page.
2. Publish CTA is visible with helper text based on `publishScheduledFor`.
3. Admin triggers publish mutation.
4. Server publishes the meeting immediately and returns `PublishMeetingResult`.
5. Edit and view caches reconcile to `status=published`, and the CTA is removed.
