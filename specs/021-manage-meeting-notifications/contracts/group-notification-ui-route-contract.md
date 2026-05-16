# Contract: Group Notification Settings UI Route

## Scope

Define navigation and rendering requirements for the member-facing group notification settings page.

## Route

- `/groups/:groupId/notifications`

## Entry Point Requirement

From group detail view (`/groups/:groupId/view`):

- Show an action near the top labeled `Edit group notification settings` for eligible members.
- Selecting the action navigates to `/groups/:groupId/notifications`.

## Page Rendering Contract

The page must render one list item per notification type, each containing:

- Bold heading
- Subdued description
- Right-aligned switch toggle

Required list items:

1. New meeting publication
2. New meeting check-in
3. Meeting attendance
4. Meeting attendance updates

## Data Contract

- Read initial state from `GET /api/groups/:groupId/notifications/me`.
- Toggle action sends `PATCH /api/groups/:groupId/notifications/me` with `notificationType` and `subscribed`.
- UI switch checked state maps to `subscribed = !isUnsubscribed`.

## Interaction Rules

- Toggling one setting must not mutate other settings.
- Failed updates must show clear feedback and restore last confirmed state.
- Revisiting the page must display persisted states.

## Accessibility Expectations

- Each switch has an accessible label tied to its heading.
- Keyboard navigation can reach each list item and toggle.
- Descriptions remain visible and readable at mobile widths.
