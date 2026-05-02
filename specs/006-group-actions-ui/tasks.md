# Tasks: Group Actions UI

**Feature Branch**: `006-group-actions-ui`  
**Created**: 2026-05-02  
**Status**: Ready for Implementation

## Overview

Implementation tasks for the Group Actions UI feature, organized by user story with dependencies. Each task is independently testable and marked with parallelization opportunities.

---

## Phase 1: Setup & Verification

### Foundation Tasks

- [x] T001 Review existing GroupMember model structure in `express/src/models/groupMembers.ts` and verify `invite.status` and `invite.statusChangedAt` fields exist
- [x] T002 Review existing group queries in `express/src/services/groupsService.ts` to understand active member filtering patterns
- [x] T003 Verify TanStack Query v5 is configured in `web/src/` for data fetching patterns

---

## Phase 2: Backend API Foundation

### Leave Group Endpoint (Supports User Story 2: Member Group View & Leave)

- [x] T004 Implement `leaveGroup(groupId: string, userId: string)` function in `express/src/services/groupsService.ts` that:
  - Calls `getUserGroupMembership(userId, groupId)` to fetch membership
  - Validates membership exists and `invite.status === 'accepted'`
  - Updates membership via `updateGroupMemberById(id, { invite: { status: 'cancelled', statusChangedAt: new Date() } })`
  - Records audit event via `recordAuditEvent({ action: 'user_left_group', userId, groupId, timestamp: new Date() })`
  - Throws typed errors (404, 409) for not found / already left scenarios

- [x] T005 Add `PATCH /api/groups/:id/leave` endpoint to `express/src/routers/groupsRouter.ts`:
  - Extract `groupId` from params, `userId` from `req.session`
  - Wrap handler with `handleAsync()` for centralized error handling
  - Call `leaveGroup()` service function
  - Return `{ success: true, message: "You have left the group" }`

- [ ] T006 [P] Test leave endpoint with authenticated user:
  - Verify endpoint returns 200 with success message
  - Verify GroupMember document is updated with `invite.status: 'cancelled'` and `invite.statusChangedAt` set
  - Verify error responses: 401 (not authenticated), 403 (not a member), 404 (group not found), 409 (already left)

---

## Phase 3: Frontend Data Fetching & State Management

### Hooks for Data & Actions (Supports User Stories 2 & 3)

- [x] T007 Create `web/src/hooks/useGroupActions.ts` hook:
  - Export `useGroupActions(options?: { onLeaveSuccess?: () => void; onLeaveError?: (error: Error) => void })` function
  - Implement `leaveGroup` mutation via `useMutation()`:
    - Calls `PATCH /api/groups/:id/leave`
    - On success: invalidate queries for `['groups']` and `['groups', groupId]`, show success toast, run optional callback
    - On error: map API errors to user-friendly messages, show error toast, run optional callback
  - Return `{ leaveGroup: { mutate, isPending, error, isSuccess } }`

- [ ] [P] T008 Verify group data fetching from existing API:
  - Confirm `GET /api/groups/:id` endpoint returns group data with members array
  - Confirm members are filtered to active only (check data model expectations)
  - Test query caching via TanStack Query

---

## Phase 4: Frontend UI Components (Supports All User Stories)

### Member List Component (Supports User Story 3: Group Summary View)

- [x] T009 Create `web/src/components/group/GroupMembersList.tsx` component:
  - Accept props: `members: Array<{ id: string; name: string; email?: string; avatar?: string }>`, `maxDisplay?: number`, `variant?: 'compact' | 'detailed'`
  - Render member list with avatars + names (compact variant)
  - Support detailed variant with email
  - Truncate at `maxDisplay` (default 10) and show "See all" link if needed
  - Export component with prop interface

- [ ] T010 [P] Test GroupMembersList component:
  - Render with 5 members in compact mode → verify all members display
  - Render with 15 members, maxDisplay=10 → verify first 10 + "See all" link
  - Test detailed variant displays emails

---

### Group Summary Modal (Supports User Story 3: Group Summary View)

- [ ] T011 Create `web/src/components/group/GroupSummaryModal.tsx` component:
  - Accept props: `groupId: string`, `isOpen: boolean`, `onClose: () => void`
  - Use TanStack Query to fetch group data: `useQuery({ queryKey: ['groups', groupId], queryFn: () => api.groups.getById(groupId) })`
  - Use ShadCN `Dialog` component for modal wrapper
  - Display sections: group name (heading), description, recurrence, time, owner name, member list (using `GroupMembersList`)
  - Handle loading state (show spinner)
  - Handle error state (show error message)
  - Show close button and support backdrop dismissal

- [ ] T012 [P] Test GroupSummaryModal component:
  - Open modal with valid groupId → verify group data loads within 1 second
  - Verify all required fields displayed (name, description, recurrence, time, owner, members)
  - Verify member list shows active members only (status: 'accepted')
  - Close modal via X button and backdrop click

---

### Group Actions Dropdown (Supports User Stories 1 & 2)

- [x] T013 Create `web/src/components/group/GroupMemberActionsDropdown.tsx` component:
  - Accept props: `groupId: string`, `userRole: 'owner' | 'admin' | 'member'`, `onViewClick?: () => void`, `onEditClick?: () => void`, `onLeaveClick?: () => void`
  - Use ShadCN `DropdownMenu` component
  - Render role-based actions:
    - **Always**: View button (Eye icon) → triggers `onViewClick()`
    - **If owner/admin**: Edit button (Pencil icon) → triggers `onEditClick()`, Manage button (Gear icon) → triggers `onManageClick()`
    - **If member**: Leave button (LogOut icon, destructive style) → triggers `onLeaveClick()`
  - Trigger: vertical dots menu icon

- [ ] T014 [P] Test GroupMemberActionsDropdown component:
  - Render as member → verify View and Leave buttons only
  - Render as owner → verify View, Edit, and Manage buttons
  - Click View button → verify `onViewClick` callback triggered
  - Click Leave button → verify `onLeaveClick` callback triggered

---

## Phase 5: Frontend Pages & Routes (Supports All User Stories)

### Group Detail Page

- [ ] T015 Create `web/src/pages/GroupDetailPage.tsx` component:
  - Accept `groupId` from route params via `useParams()`
  - Fetch group data via TanStack Query
  - Display header with group name + `GroupMemberActionsDropdown`
  - Display group details (full description, meeting info, owner info)
  - Display active members list (using `GroupMembersList`)
  - Manage modal state for `GroupSummaryModal` (useState for `isOpen`)
  - Handle leave group: show confirmation dialog, call `useGroupActions().leaveGroup()` mutation, navigate to `/groups` on success

- [ ] T016 Create `web/src/routes/groups.$id.tsx` file-based route:
  - Use TanStack Router naming convention
  - Define route as `createFileRoute('/groups/$id')` with component: `GroupDetailPage`
  - Page should be accessible at `/groups/[groupId]`

- [ ] T017 [P] Test group detail page:
  - Navigate to `/groups/[valid-id]` → verify page loads group data
  - Verify all group info displays (name, description, owner, members)
  - Verify `GroupMemberActionsDropdown` is visible in header
  - As member, click Leave button → verify confirmation dialog, then leave API call

---

## Phase 6: Integration with Existing Views (Supports User Stories 1 & 2 & 3)

### Integrate Dropdown into Group List Views

- [ ] T018 Update existing group list/card components to include `GroupMemberActionsDropdown` and `GroupSummaryModal`:
  - Find all components that display groups (e.g., `MyGroupsPage`, group card components)
  - Import `GroupMemberActionsDropdown` and `GroupSummaryModal`
  - Add dropdown to each group card/row
  - Add modal state management (useState for `isOpen`)
  - Wire View button to open modal
  - Wire Leave button to mutation with confirmation
  - Wire Edit button to navigate to group edit form
  - Test that dropdown actions work in list context

- [ ] T019 [P] Verify role-based actions display correctly across all views:
  - Group list as member → verify View and Leave actions only
  - Group list as owner → verify View, Edit, and Manage actions
  - Group detail page as member → verify View and Leave actions
  - Group detail page as owner → verify View, Edit, and Manage actions

---

## Phase 7: Polish & Cross-Cutting Concerns

### Error Handling & UX Refinement

- [ ] T020 Enhance leave group confirmation flow:
  - Show confirmation modal with message: "Are you sure you want to leave this group? You can rejoin later."
  - Display group name in confirmation
  - Show loading state on Leave button during API call
  - Show error toast if leave fails

- [ ] T021 Handle edge cases:
  - Test leaving a group where user is the only owner → verify error or prevent with disabled button
  - Test viewing group summary with no description → verify empty state or placeholder
  - Test viewing group with 500+ members → verify performance (<1 second load time)
  - Test clicking leave while already leaving (race condition) → verify idempotent behavior

- [ ] T022 Mobile responsive testing:
  - Test dropdown on mobile (tap to open, tap to close)
  - Test modal on mobile (full-screen or centered, test dismiss)
  - Test group list on mobile (actions accessible)
  - Verify touch targets are adequate (min 44x44px)

- [ ] T023 [P] Update UI documentation (README or component docs):
  - Document `GroupMemberActionsDropdown` component props and usage
  - Document `GroupSummaryModal` component props and usage
  - Document `useGroupActions` hook and error mapping
  - Add usage examples

---

## Phase 8: Testing & Verification

### End-to-End Scenarios

- [ ] T024 Test User Story 1 - Admin/Owner Group Actions (P1):
  - Login as group owner
  - Navigate to my groups → verify Edit and Manage buttons visible
  - Click Edit button → verify navigates to edit form
  - Go back to group list → verify Manage button accessible

- [ ] T025 Test User Story 2 - Member Group View & Leave (P1):
  - Login as group member
  - Navigate to my groups → verify View and Leave buttons visible (no Edit/Manage)
  - Click Leave button → verify confirmation modal
  - Confirm leave → verify success toast and removed from group list
  - Verify group no longer appears in "My Groups"

- [ ] T026 Test User Story 3 - Group Summary View (P1):
  - Login as any user
  - Click View (eye icon) button → verify modal opens
  - Verify all fields displayed: name, description, recurrence, time, owner, member list
  - Verify only active members shown (not cancelled/left members)
  - Close modal → verify backdrop click and X button both work
  - Open modal again → verify data loads from cache (<100ms)

- [ ] T027 [P] Success criteria validation:
  - **SC-001**: 100% of group owners and admins see edit button → verify via UI check in 3+ groups
  - **SC-002**: 0% of regular members see edit/deactivate options → verify role check
  - **SC-003**: 100% of regular members see view button (eye icon) → verify via UI check
  - **SC-004**: 100% of group summary views display all info → verify in modal
  - **SC-005**: Users can leave group with confirmation → verify workflow
  - **SC-006**: Group summary loads <1 second → verify with 500+ member group
  - **SC-007**: UI consistent across list + detail pages → verify visual consistency

---

## Dependencies Graph

```
T001 (Review Model)
  └─→ T002 (Review Queries)
        └─→ T004 (Implement leaveGroup service)
              └─→ T005 (Add endpoint) [P T006 Test]
                    └─→ T007 (useGroupActions hook)
                          └─→ T013 (GroupMemberActionsDropdown)
                                ├─→ T018 (Integrate dropdown)
                                └─→ T019 (Role-based verification)

T009 (GroupMembersList) [P T010]
  └─→ T011 (GroupSummaryModal) [P T012]
        └─→ T015 (GroupDetailPage)
              ├─→ T016 (Group detail route)
              └─→ T017 (Test page)
                    └─→ T024-T027 (E2E testing)

T020 (Confirmation flow)
T021 (Edge cases) [P]
T022 (Mobile testing) [P]
T023 (Documentation) [P]
```

---

## Parallelization Opportunities

**Parallel execution sets** (can work simultaneously):

1. **T001 + T003**: Review models in parallel (independent systems)
2. **T006 (Test) + T007 (Hook)**: Test backend while implementing frontend hook
3. **T009 + T010 (MembersList) + T011 (Modal)**: Develop components in parallel; modal depends on finished component
4. **T021 + T022 + T023**: Edge cases, mobile testing, documentation can run in parallel
5. **T024 + T025 + T026**: End-to-end tests for all user stories can run in parallel

---

## Definition of Done (Per Task)

✅ **Code Requirements**:

- TypeScript strict mode compliance
- No `any` types without justification
- All imports use `@/` path alias (frontend) or relative paths (backend)
- No unused variables or imports
- Error messages map to HTTP status codes semantically

✅ **Testing Requirements**:

- Manual test execution confirmed
- Edge cases considered
- Error scenarios handled
- No console errors in browser/server logs

✅ **Documentation Requirements**:

- Function/component JSDoc comments
- Props/parameter documentation
- Error handling documented

---

## Rollback Plan

If critical issues arise:

1. **Leave endpoint fails**: Comment out route in `groupsRouter.ts`, restart server
2. **Dropdown rendering fails**: Disable component import in group list views
3. **Modal data fetch fails**: Replace with simpler inline summary view
4. **Leave causes data corruption**: Revert GroupMember updates via MongoDB query

---

## Success Metrics

- ✅ All 27 tasks completed
- ✅ Zero console errors
- ✅ All acceptance scenarios passing
- ✅ All success criteria (SC-001 through SC-007) validated
- ✅ Mobile responsive verified
- ✅ Performance <1 second for group summary (500+ members)
- ✅ User satisfaction: Leave flow intuitive, role-based actions clear

---

## Completeness Checklist

- ✅ Tasks organized by user story (US1, US2, US3)
- ✅ All tasks are independently testable
- ✅ Dependencies clearly defined
- ✅ Parallelization opportunities marked [P]
- ✅ File paths explicit (`express/src/...`, `web/src/...`)
- ✅ All 15 functional requirements mapped to tasks
- ✅ All 7 success criteria testable via tasks
- ✅ End-to-end validation tasks included
- ✅ Edge cases and mobile considerations included
