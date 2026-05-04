# Quickstart: Meeting View And Edit

## Implementation Order

1. Add backend read and edit contracts.

- Add a member-facing meeting detail service and router endpoint.
- Add an admin-only edit-read endpoint and a debounced autosave patch endpoint.
- Add a dedicated publish endpoint for draft meetings.

2. Build backend DTO shaping and authorization.

- Reuse `getMembershipByGroup(...)` for authorization checks.
- Aggregate meeting, participant, and check-in data into the new detail DTO.
- Keep member view and admin edit response shapes separate.

3. Extend frontend API and query wrappers.

- Add new API types and functions in `web/src/api/types/groups.ts` and `web/src/api/groups.ts`.
- Add `useMeetingViewQuery`, `useEditableMeetingQuery`, `useSaveMeetingMutation`, and `usePublishMeetingMutation` with per-hook `.key` helpers.

4. Add breadcrumbed pages and routes.

- Create the meeting view page and route.
- Replace the edit page shell with the real edit workflow.
- Ensure both pages use `PageCard` plus breadcrumb headers.

5. Implement edit form and autosave.

- Create `MeetingForm` as a presentational component.
- Create `useMeetingForm` to own validation, debounce, autosave state, and toast feedback.
- Keep patch payloads sparse so unchanged optional values are omitted.

6. Wire new action buttons into existing meeting surfaces.

- Add `view meeting` to `MeetingFeedItem` for all users.
- Add `edit meeting` to `MeetingFeedItem` for admins and owners.
- Add grouped `view` and `edit` buttons to `GroupMeetingsSection`.

7. Finish publish and attendance behavior.

- Show the publish CTA only for draft meetings.
- Render helper text explaining the scheduled automatic publish time.
- Keep the view page quick check-in flow synchronized with existing check-in mutation behavior.

## Manual Verification

1. Open a meeting from the home feed as a member and verify the breadcrumbed meeting view page loads.
2. Open a meeting from the group meetings section as an admin and verify both `view` and `edit` actions are present.
3. Verify the meeting view page shows address, description, participant statuses, and the signed-in user's attendance state near the top.
4. Change attendance from the meeting view page and verify the updated state persists after refresh.
5. Open the meeting edit page as an admin, change several fields, pause typing, and verify a single debounced autosave occurs.
6. Verify successful autosave shows toast feedback and failed autosave preserves local edits with recoverable error messaging.
7. Verify draft meetings show the bright publish button and helper text, and that publishing updates the meeting to published immediately.
8. Verify non-admin users never see edit or publish controls.

## Validation Commands

- `cd express && npm run build`
- `cd web && npm run build`
- `cd web && npm run lint`

## Final Verification Notes

- Route-level verification should cover both direct navigation and entry from existing meeting surfaces.
- Autosave verification should confirm debounced saves do not fire on every keystroke.
- Contract verification should confirm member view payloads do not expose admin-only edit fields.
