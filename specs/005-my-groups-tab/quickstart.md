# Quickstart: My Groups Tab and Group Management Flows

## Prerequisites

- Install dependencies for both projects:
  - `cd web && npm install`
  - `cd express && npm install`
- Ensure MongoDB and environment configuration are available for local development.

## 1) Start local services

1. Run backend server:
   - `cd express && npm run dev`
2. Run frontend server:
   - `cd web && npm run dev`
3. Authenticate with a test account that has group membership data.

## 2) Validate My Groups tab core behavior

1. Open authenticated home page.
2. Select My Groups tab.
3. Confirm group cards render required summary fields:
   - name, recurrence, active/invited member counts, past meeting count, next upcoming meeting date (when present), Edit action, actions dropdown.
4. Scroll to trigger infinite loading and confirm:
   - additional groups append,
   - no duplicates appear,
   - terminal state when no more pages are available.

## 3) Validate create/edit group routing and form

1. Click Create New Group and verify navigation to `/groups/create`.
2. Confirm create form includes:
   - name, description (basic rich text), address, start time, duration, recurrence, public message, attendance message.
3. Confirm admin/member searchable multi-select controls:
   - options show avatar + name,
   - selected users display as list items beneath each select.
4. Open an existing group from Edit action and verify navigation to `/groups/:groupId/edit` with pre-populated values.

## 4) Validate group actions and meeting flow

1. Open actions dropdown for active group and verify Deactivate action.
2. Open actions dropdown for inactive group and verify Activate action.
3. For a group with upcoming meeting, verify View Upcoming Meeting action exists.
4. For a group without upcoming meeting, choose Create Manual Meeting and verify:
   - a meeting is created from group defaults,
   - navigation lands on `/groups/:groupId/meetings/:meetingId/edit`.

## 5) Failure-state checks

1. Simulate list page fetch failure and verify recoverable retry UX.
2. Trigger invalid group/meeting route parameters and verify safe not-found/forbidden handling.
3. Verify activation/deactivation conflict or validation errors surface actionable messages.

## 6) Build validation

1. Frontend checks:
   - `cd web && npm run lint`
   - `cd web && npm run build`
2. Backend checks:
   - `cd express && npm run build`
