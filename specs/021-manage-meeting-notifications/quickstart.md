# Quickstart: Manage Group Meeting Notifications

## Goal

Implement per-group member meeting-notification preferences using `groupMembers.unsubscribedNotifications` as a notification-type boolean map (`true` = unsubscribed, `false` = subscribed).

## Implementation Order

1. Backend model updates

- Extend `GroupMemberDefinition` with `unsubscribedNotifications` typed map.
- Extend update input/normalization to support key/value boolean updates.
- Ensure returned membership response can expose notification settings payload.

2. Backend service and router updates

- Add service methods to read and update current member notification settings.
- Add routes:
  - `GET /api/groups/:groupId/notifications/me`
  - `PATCH /api/groups/:groupId/notifications/me`
- Validate `notificationType` and `unsubscribed` body fields.

3. Delivery filtering integration

- Add helper: `isUnsubscribed(membership, type)`.
- Apply helper in each notification recipient path:
  - new meeting publication
  - new meeting check-in
  - attendance summary
  - attendance updates

4. Frontend API and query hooks

- Add types + API methods in `web/src/api/types/groups.ts` and `web/src/api/groups.ts`.
- Add query/mutation wrappers in `web/src/queries/` with key helpers.
- Implement optimistic toggle behavior with rollback on failure.

5. Frontend route and UI

- Add route file: `web/src/routes/groups/$groupId/notifications.tsx`.
- Add page component for notification settings with `Item` rows and `Switch` controls.
- Add `Edit group notification settings` entry action near top of `group-view` page.

6. Validation and regression checks

- Verify persistence and route access.
- Verify boolean map semantics (`true` unsubscribed / `false` subscribed).
- Verify non-target toggles remain unchanged.
- Verify unsubscribed recipients are excluded from matching email notifications.

## Manual Validation Scenarios

1. First-open defaults

- Open settings for membership with no stored preferences.
- Confirm all toggles show subscribed and API returns empty object or missing field.

2. Unsubscribe behavior

- Toggle `Meeting attendance` off.
- Confirm persisted map includes `meetingAttendance: true`.

3. Resubscribe behavior

- Toggle the same setting back on.
- Confirm `meetingAttendance` key is stored as `false`.

4. Isolation behavior

- Toggle one setting and confirm other setting values are unchanged.

5. Authorization behavior

- Attempt access as non-member or removed member.
- Confirm request is rejected via existing auth/error contract.

6. Delivery behavior

- Mark user unsubscribed for `newMeetingPublication`.
- Publish meeting and verify user does not receive that publication email.

## Build Checks

- `cd express && npm run build`
- `cd web && npx tsc --noEmit`

## Example PATCH Payload

```json
{
  "notificationType": "newMeetingCheckin",
  "unsubscribed": true
}
```

## Expected Persistence Outcome

```json
{
  "unsubscribedNotifications": {
    "newMeetingCheckin": true
  }
}
```

Re-subscribing with `unsubscribed: false` sets `newMeetingCheckin` to `false`.

## Validation Notes (May 15, 2026)

- Backend compile validation passed: `cd express && npm run build`.
- Frontend typecheck validation passed: `cd web && npx tsc --noEmit`.
- Manual delivery filtering currently verified for meeting publication path.
- Check-in availability and attendance summary/update email send paths are not implemented yet in current services/jobs, so those unsubscribe filters remain pending implementation once those send paths exist.
