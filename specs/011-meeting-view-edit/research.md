# Research: Meeting View And Edit

## Decision 1: Separate member view and admin edit endpoints

- Decision: Use separate meeting endpoints and response shapes for the member-facing detail page and the admin edit workflow.
- Rationale: The user explicitly requires view and edit not to share the same endpoint because the admin payload contains more fields and permissions. Separate contracts keep authorization and DTO shaping clear.
- Alternatives considered: One shared `GET` endpoint with conditional fields. Rejected because it couples member and admin payload concerns, increases risk of leaking edit-only fields, and makes client typing less explicit.

## Decision 2: Keep both new pages inside the existing group route hierarchy and add breadcrumbs

- Decision: Add `/groups/$groupId/meetings/$meetingId/view` and continue using `/groups/$groupId/meetings/$meetingId/edit`, with both pages rendered in `PageCard` and a light breadcrumb header.
- Rationale: This follows the existing TanStack Router file structure, keeps group context visible, and satisfies the breadcrumb requirement for new pages.
- Alternatives considered: Global meeting routes without `groupId`. Rejected because current page shells and navigation already organize meeting management under group context and breadcrumbs would lose that context.

## Decision 3: Implement edit persistence as debounced autosave through a form hook

- Decision: Drive the edit page with a `useMeetingForm` hook that stages field state locally, debounces changes, calls a `useSaveMeetingMutation` wrapper after a short pause, and shows `alert.success(...)` on successful saves.
- Rationale: Constitution Principle VI requires hook-owned form state, while Principle XII requires mutation ownership in wrappers. Debounced autosave reduces write volume and matches the user requirement to save on paused input rather than on explicit submit.
- Alternatives considered: Manual save button only. Rejected because it conflicts with the requested autosave behavior. Per-keystroke patching was also rejected because it would create unnecessary network chatter and noisy toast feedback.

## Decision 4: Build meeting detail data by combining meeting, membership, attendees, and check-in state

- Decision: The meeting detail service should assemble the page payload from `groupMeetings`, `groupMembers`, `meetingAttendees`, and `meetingCheckins`, using `getMembershipByGroup(...)` for authorization checks.
- Rationale: The detail page needs both the signed-in user's state and the broader participant list with attendance statuses. Repo memory already warns against list-by-group authorization checks with fixed limits.
- Alternatives considered: Derive the participant list entirely from the home feed DTO. Rejected because the feed intentionally contains summary-level data and does not carry the per-member attendance list needed for the detail screen.

## Decision 5: Publish should be a dedicated admin action, not a side effect of autosave

- Decision: Use a separate publish mutation endpoint for draft meetings, and keep autosave patches focused on editable field persistence.
- Rationale: Publishing has distinct semantics, user messaging, and side effects. A dedicated mutation maps cleanly to the existing `publishGroupMeetingById` backend helper and supports a bright CTA with explanatory helper text.
- Alternatives considered: Allow autosave to publish when `status` changes to `published`. Rejected because it makes a high-impact action too easy to trigger accidentally during ordinary editing.
