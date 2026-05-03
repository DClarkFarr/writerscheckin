# Data Model: My Groups Pagination

## Entities

### GroupSummaryRecord

Represents the lightweight group payload used in My Groups and as the base summary object for group detail screens.

| Field                   | Type                       | Notes                                            |
| ----------------------- | -------------------------- | ------------------------------------------------ |
| `groupId`               | string                     | Stable identifier for navigation and cache keys. |
| `name`                  | string                     | Group display name.                              |
| `recurrence`            | string                     | Summary recurrence label.                        |
| `isActive`              | boolean                    | Used for action availability and status display. |
| `userRole`              | `owner \| admin \| member` | Determines available actions.                    |
| `counts.activeMembers`  | number                     | Accepted or owner members count.                 |
| `counts.invitedMembers` | number                     | Invited members count.                           |
| `counts.pastMeetings`   | number                     | Published past meetings count.                   |
| `nextUpcomingMeeting`   | object or `null`           | Summary pointer to the next meeting, if any.     |
| `availableActions`      | object                     | Existing action availability summary.            |

Validation rules:

- Does not include `members`.
- Safe for My Groups cards and detail headers.
- Count fields default to zero when absent.

### GroupDetailSummaryRecord

Represents the non-collection fields needed for group view/edit pages.

| Field                           | Type      | Notes                             |
| ------------------------------- | --------- | --------------------------------- |
| All `GroupSummaryRecord` fields | inherited | Summary baseline.                 |
| `description`                   | string    | Rich description text.            |
| `address`                       | string    | Location string.                  |
| `startTime`                     | string    | Existing formatted time contract. |
| `durationMinutes`               | number    | Meeting duration.                 |
| `recurrenceFrequency`           | string    | Edit-form recurrence input.       |
| `recurrenceDaysOfWeek`          | number[]  | Edit-form recurrence input.       |
| `publicMessage`                 | string    | Form field.                       |
| `attendanceMessage`             | string    | Form field.                       |

Validation rules:

- Does not include members or meetings arrays.
- Remains compatible with group view header sections and group edit form initialization.

### GroupMembersPage

Represents one paginated batch of members for an opened group.

| Field        | Type               | Notes                         |
| ------------ | ------------------ | ----------------------------- |
| `rows`       | `GroupMemberRow[]` | Ordered append-only batch.    |
| `nextCursor` | string or `null`   | `null` means no more results. |

`GroupMemberRow` fields:

- `_id`
- `identifier`
- `userId`
- `email`
- `name`
- `avatarUrl`
- `role`
- `status`

Validation rules:

- Default page size is 20.
- Rows already loaded remain visible while a next page is loading.
- Load More is shown only when `nextCursor` is non-null.

### GroupMeetingsPage

Represents one paginated batch of meetings for an opened group.

| Field        | Type                | Notes                                        |
| ------------ | ------------------- | -------------------------------------------- |
| `rows`       | `GroupMeetingRow[]` | Ordered newest-to-oldest by occurrence time. |
| `nextCursor` | string or `null`    | `null` means no more results.                |

`GroupMeetingRow` minimum fields:

- `meetingId`
- `occursAt`
- `status`
- Any existing summary fields needed for list rendering/action links

Validation rules:

- Default page size is 20.
- Sort order is descending by occurrence date, with a deterministic tiebreaker.
- Additional pages append older meetings after newer ones already shown.

## Relationships

- One `GroupDetailSummaryRecord` has many `GroupMembersPage.rows`.
- One `GroupDetailSummaryRecord` has many `GroupMeetingsPage.rows`.
- `GroupSummaryRecord.counts` are aggregate values and must not require collection hydration.

## Query State Transitions

### My Groups Feed

1. Initial load requests the first `GroupSummaryRecord` page.
2. Scroll trigger requests the next page using `nextCursor`.
3. New page items append to the existing flattened group list.
4. Failure leaves prior pages intact and exposes retry.

### Group Detail Feed

1. Opening a group starts three independent reads in parallel: summary, members page 1, meetings page 1.
2. Members Load More requests the next `GroupMembersPage` and appends rows.
3. Meetings Load More requests the next `GroupMeetingsPage` and appends rows.
4. Either collection can fail independently without clearing the other collection or the summary.
