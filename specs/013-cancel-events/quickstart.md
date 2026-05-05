# Quickstart: Cancel Published Meetings

## Implementation order

1. Expand shared meeting status types to include `cancelled` and add `cancelledAt` as nullable meeting field in backend and frontend contracts.
2. Update backend meeting model normalization/defaults so new meetings persist with `cancelledAt = null`.
3. Add cancel meeting backend mutation path (model/service/router) with guards for role, state, and concurrency.
4. Enforce server-side mutation restrictions that block edit/publish/check-in for canceled meetings.
5. Add frontend API function + query mutation hook for cancel action and wire invalidation for affected meeting queries.
6. Update feed item dropdown to show cancel action wherever publish-related actions currently live for eligible meetings.
7. Replace meeting form publish card behavior for published meetings with cancellation card and confirmation dialog.
8. Extend derived meeting UI state to include canceled tone (dark orange/gray) and capability rules (`canCheckin=false`, `canEdit=false`).
9. Update check-in and meeting edit surfaces to honor canceled-state restrictions and messaging.

## Verification checklist

1. Admin sees `Cancel meeting` action in meeting feed dropdown for eligible published meetings.
2. Admin sees cancellation card (not publish card) in meeting form when meeting is published.
3. Cancel action opens confirmation dialog with RSVP notification warning copy.
4. Dismissing dialog does not cancel the meeting.
5. Confirming dialog sets meeting to canceled and records non-null `cancelledAt`.
6. Canceled meetings still appear in normal meeting lists/details.
7. Canceled meetings render with dark orange and gray visual treatment.
8. Check-in controls are disabled/unavailable for canceled meetings.
9. Edit controls are disabled/unavailable for canceled meetings.

## Suggested validation commands

```bash
cd express && npm run build
cd web && npm run lint
cd web && npm run build
cd web && npx tsc --noEmit
```

## Manual checks

1. As admin, publish a meeting and then cancel it from feed dropdown; verify list refresh and canceled styling.
2. As admin, open meeting form for published meeting; verify cancellation card appears and publish card does not.
3. As member, open canceled meeting surfaces and confirm no check-in action is available.
4. Attempt direct edit/save on canceled meeting URL; verify operation is blocked with clear feedback.
5. Verify canceled meeting remains visible in my meetings pagination and detail view.
