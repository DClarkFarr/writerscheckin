# Data Model: Manage Group Meeting Notifications

## Entity: GroupMember (existing, extended)

Represents a user's membership in a specific group.

### New Field

- `unsubscribedNotifications?: GroupMemberUnsubscribedNotifications`

### Shape

`GroupMemberUnsubscribedNotifications` is a sparse object with optional keys:

- `newMeetingPublication?: true`
- `newMeetingCheckin?: true`
- `meetingAttendance?: true`
- `meetingAttendanceUpdates?: true`

### Semantics

- Empty object or missing field means the member is subscribed to all notification types.
- A key with truthy value (`true`) means the member is unsubscribed from that type.
- Subscribing again removes the key from the object.

### Validation Rules

- Unknown notification keys are rejected.
- Values must be boolean `true` for stored unsubscribe flags.
- Update operations never persist `false`; subscribing is represented via key removal.

---

## Entity: GroupMemberNotificationSettingsView (derived response)

Read model returned to the UI for a member's settings page.

### Fields

- `groupId: string`
- `membershipId: string`
- `unsubscribedNotifications: GroupMemberUnsubscribedNotifications`
- `updatedAt: string`

### Derived Helper

- `isUnsubscribed(type) = Boolean(unsubscribedNotifications?.[type])`

This helper is used by API handlers, delivery filtering, and UI switch checked-state mapping.

---

## Entity: NotificationSettingDefinition (frontend/static contract)

Defines render metadata for each toggle row.

### Fields

- `type: NotificationType`
- `heading: string`
- `description: string`

### Required Definitions

- `newMeetingPublication`
- `newMeetingCheckin`
- `meetingAttendance`
- `meetingAttendanceUpdates`

---

## State Transitions

### Toggle State Machine (per notification type)

1. `Subscribed` (key absent)
2. `Unsubscribed` (key present with `true`)

Transitions:

- `Subscribed -> Unsubscribed`: on toggle off, persist key as `true`.
- `Unsubscribed -> Subscribed`: on toggle on, remove key.

### Delivery Decision

For notification event type `T`:

- If `Boolean(unsubscribedNotifications?.[T]) === true`, suppress email.
- Otherwise, include member in recipient set.

---

## Backward Compatibility Notes

- Existing memberships without `unsubscribedNotifications` remain valid and interpreted as fully subscribed.
- No migration is required to backfill old documents.
- Existing group/member response fields remain unchanged; only additive settings payloads are introduced.
