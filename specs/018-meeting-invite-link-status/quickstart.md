# Quickstart: Meeting Invite Link Status

## Implementation order

1. Add access-state resolution in backend meeting/group membership services for invite-link requests.
2. Ensure response payload for non-active states always includes group name and group description.
3. Add pending-invite actions (accept, decline) in service layer and expose via existing route boundaries.
4. Add rejoin-request action for declined/left/removed states and wire notification email to responsible group admin.
5. Update invite-link frontend query behavior to stop repeated retries for known authorization outcomes.
6. Implement status-aware invite landing UI states/messages with action rendering by `availableActions`.
7. Validate transitions after accept/decline and request-to-join submission outcomes in the same flow.

## Status behaviors

- `pending_invite`: show group context, guidance text, `Accept` + `Decline` buttons.
- `not_invited`: show group context and not-invited explanation.
- `declined_or_left`: show group context, reinvite guidance, `Request to join` button.
- `removed`: show group context, reinvite guidance, `Request to join` button.
- `unknown_or_expired`: show group context with safe fallback explanation.
- `active_member`: continue with normal meeting access flow.

## API/UX verification checklist

1. Invite-link request for each non-active state renders status-specific UI without generic forbidden red screen.
2. Group name and group description appear in all non-active outcomes.
3. Pending-invite accept action grants access in-flow.
4. Pending-invite decline action confirms decline state.
5. Declined/removed request-to-join action submits successfully and confirms notification sent.
6. Request-to-join failure path shows explicit user-facing failure feedback.
7. Invite-link query does not repeatedly retry known authorization outcomes.

## Suggested validation commands

```bash
cd express && npm run build
cd web && npx tsc --noEmit
```

## Manual validation scenarios

1. Open the same meeting invite URL as users in each status (`pending_invite`, `not_invited`, `declined_or_left`, `removed`, `active_member`) and verify expected state rendering.
2. From pending state, click Accept and verify transition to active access path.
3. From pending state, click Decline and verify decline confirmation and blocked access state.
4. From declined/removed state, click Request to join and verify admin receives email with requester email and target group/meeting context.
5. Simulate admin-email resolution failure and verify user-visible failure message.
