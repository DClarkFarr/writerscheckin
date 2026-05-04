# Data Model: My Meetings Tab

## Entities

### MyMeetingFeedItem

Standardized row returned in the My Meetings infinite feed.

| Field                | Type                                                  | Notes                                                                   |
| -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `meetingId`          | string                                                | Stable identifier for feed keys and updates.                            |
| `groupId`            | string                                                | Parent group identifier.                                                |
| `groupName`          | string                                                | Group context shown in each card.                                       |
| `name`               | string                                                | Meeting display name.                                                   |
| `occursAt`           | string (ISO)                                          | Canonical occurrence timestamp for sorting and rendering.               |
| `segment`            | `upcoming` \| `past`                                  | Determines feed section order.                                          |
| `status`             | `published` \| `draft`                                | Backend publication state.                                              |
| `isDraft`            | boolean                                               | Convenience flag for display and behavior.                              |
| `isAdminOnly`        | boolean                                               | True only for rows visible to owner/admin users due to elevated rights. |
| `showAdminOnlyBadge` | boolean                                               | True when the `admin only` hidden-eye badge should render.              |
| `attendingCount`     | number                                                | Current attendee total.                                                 |
| `readingCount`       | number                                                | Current reader total.                                                   |
| `userCheckinState`   | `attending` \| `reading` \| `not_attending` \| `none` | User-specific state.                                                    |
| `canCheckin`         | boolean                                               | True for eligible upcoming meetings.                                    |
| `displayTone`        | `blue` \| `red` \| `gray`                             | Card border/bookend/button color rule.                                  |

Validation rules:

- `segment=upcoming` rows always appear before `segment=past` rows in flattened order.
- For members, `status=draft` rows are never emitted.
- `displayTone=red` applies for upcoming meetings where `userCheckinState=not_attending`.

### MyMeetingsPage

Paginated batch envelope for the infinite feed.

| Field        | Type                  | Notes                              |
| ------------ | --------------------- | ---------------------------------- |
| `items`      | `MyMeetingFeedItem[]` | Ordered rows for one page.         |
| `nextCursor` | string \| null        | Cursor for fetching the next page. |

Validation rules:

- Cursor ordering is deterministic by segment, occurrence time, name, and id tie-breaker.
- `nextCursor=null` means end of feed.

### MeetingCheckinUpdate

Mutation request/response domain object for attendance changes.

| Field              | Type                                        | Notes                               |
| ------------------ | ------------------------------------------- | ----------------------------------- |
| `meetingId`        | string                                      | Target meeting.                     |
| `newState`         | `attending` \| `reading` \| `not_attending` | Requested user check-in state.      |
| `appliedAt`        | string (ISO)                                | Server-applied timestamp.           |
| `userCheckinState` | same as `newState`                          | Confirmed state returned to client. |
| `attendingCount`   | number                                      | Recalculated attendee total.        |
| `readingCount`     | number                                      | Recalculated reader total.          |

## Relationships

- One `MyMeetingsPage` has many `MyMeetingFeedItem` rows.
- One `MyMeetingFeedItem` can have zero or one check-in record for the authenticated user.
- `MeetingCheckinUpdate` mutates exactly one `MyMeetingFeedItem` and may alter aggregate counts.

## State Transitions

### Feed Loading

1. Initial page fetch returns ordered rows with `upcoming` segment first.
2. Scroll trigger requests next page by `nextCursor`.
3. New page appends rows without replacing previous pages.
4. Duplicate `meetingId` rows are ignored during merge.

### Check-In Drawer Flow

1. User clicks `check in` or `update check-in` on an upcoming row.
2. Drawer opens with three choices: `attending`, `reading`, `not attending`.
3. Selecting an option triggers optimistic mutation.
4. UI immediately updates badge text, button label, tone, and counts.
5. On failure, previous cached row state is restored and error feedback is shown.
6. On success, optimistic row reconciles with server-returned counts/state.
