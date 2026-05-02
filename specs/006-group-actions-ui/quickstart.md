# Quick Start: Group Actions UI

**Created**: 2026-05-02  
**Feature**: [Group Actions UI](../spec.md)

## Implementation Order & Steps

Follow this sequence for optimal development flow. Each step should be independently testable.

---

## Phase 1: Backend Data Model & API

### Step 1: Understand GroupMember Model Structure

**File**: `express/src/models/groupMembers.ts`

**Context**:

The GroupMember model already has the necessary structure for tracking leaves:

- `invite.status`: Can be `'invited' | 'accepted' | 'declined' | 'cancelled'`
- `invite.statusChangedAt`: Tracks when the status changed
- `deletedAt`: Soft-delete marker

**Key Functions to Review**:

1. `updateGroupMemberById(id, updates)` — Used to update invite status
2. `listGroupMembersByGroupId(groupId, options)` — Used to list members
3. Existing indexes on `{ groupId: 1, role: 1, deletedAt: 1 }` and `{ groupId: 1, userId: 1 }`

**Changes Needed**: None to the model itself. The schema already supports the leave functionality via `invite.status: 'cancelled'` and `invite.statusChangedAt`.

**Test**: Verify model compiles and existing functions work as expected.

---

### Step 2: Create Leave Group Service Function

**File**: `express/src/services/groupsService.ts`

**Changes**:

1. Add `leaveGroup(groupId: string, userId: string)` function
   - Fetch user's group membership via `getUserGroupMembership(userId, groupId)`
   - Validate that `membership.invite.status === 'accepted'` (active member)
   - Call `updateGroupMemberById(membership._id, { invite: { status: 'cancelled', statusChangedAt: new Date() } })`
   - Record audit event: `{ action: 'user_left_group', userId, groupId, timestamp }`
   - Throw appropriate errors (404 if not found, 409 if already left)

2. Update `getGroupWithMembers()` to filter only active members:
   ```typescript
   const members = await listGroupMembersByGroupId(groupId);
   const activeMembers = members.filter(
     (m) => m.invite.status === "accepted" && !m.deletedAt,
   );
   ```

**Test**: Call service functions directly in test file or REPL.

---

### Step 3: Add Leave Endpoint

**File**: `express/src/routers/groupsRouter.ts`

**Changes**:

1. Add `PATCH /groups/:id/leave` route
2. Extract `groupId` from params, `userId` from `req.session`
3. Call `leaveGroup()` service function
4. Return success response: `{ success: true, message: "You have left the group" }`
5. Wrap with `handleAsync()` for error handling

**Test**: Use Postman/curl to test endpoint:

```bash
PATCH http://localhost:3000/api/groups/[group-id]/leave
Authorization: Bearer [session-cookie]
```

Verify the response and check MongoDB to confirm:

- `invite.status` is set to `'cancelled'`
- `invite.statusChangedAt` is set to current timestamp

---

## Phase 2: Frontend Components

### Step 4: Create useGroupActions Hook

**File**: `web/src/hooks/useGroupActions.ts`

**Changes**:

1. Create hook with `leaveGroup` mutation
2. Use TanStack Query `useMutation` for `PATCH /api/groups/:id/leave`
3. Handle success: invalidate group queries, show toast, run callback
4. Handle error: map API errors to user messages, show toast
5. Export typed return interface

**Test**:

```tsx
const { leaveGroup } = useGroupActions();
leaveGroup.mutate("group-id"); // Should call API and show toast
```

---

### Step 5: Create GroupMembersList Component

**File**: `web/src/components/group/GroupMembersList.tsx`

**Changes**:

1. Create component accepting `members` array
2. Support `maxDisplay` for truncation
3. Support `variant` (compact vs. detailed)
4. Render list with avatars and names
5. Export component

**Test**:

```tsx
<GroupMembersList members={[{ id: "1", name: "Alice" }]} variant="compact" />
```

---

### Step 6: Create GroupSummaryModal Component

**File**: `web/src/components/group/GroupSummaryModal.tsx`

**Changes**:

1. Create component accepting `groupId`, `isOpen`, `onClose`
2. Use TanStack Query to fetch group data
3. Use ShadCN `Dialog` for modal wrapper
4. Display sections: name, description, recurrence, time, owner, members
5. Use `GroupMembersList` for active members rendering
6. Handle loading/error states

**Test**:

```tsx
<GroupSummaryModal groupId="123" isOpen={true} onClose={() => {}} />
// Should fetch group data and display in modal
```

---

### Step 7: Create GroupMemberActionsDropdown Component

**File**: `web/src/components/group/GroupMemberActionsDropdown.tsx`

**Changes**:

1. Create component accepting `groupId`, `userRole`, callbacks
2. Use ShadCN `DropdownMenu` for wrapper
3. Render role-based actions:
   - **Always**: View button (eye icon)
   - **If admin/owner**: Edit button (pencil icon), Manage button (gear icon)
   - **If member**: Leave button (log-out icon, destructive style)
4. Call provided callbacks on action click
5. Export component

**Test**:

```tsx
// As member:
<GroupMemberActionsDropdown groupId="123" userRole="member" />
// Should show View and Leave buttons

// As owner:
<GroupMemberActionsDropdown groupId="123" userRole="owner" />
// Should show View, Edit, and Manage buttons
```

---

## Phase 3: Frontend Routes & Pages

### Step 8: Create GroupDetailPage Component

**File**: `web/src/pages/GroupDetailPage.tsx`

**Changes**:

1. Accept `groupId` from route params (via `useParams()`)
2. Fetch group data via TanStack Query
3. Display group details (name, description, meetings, members)
4. Render `GroupMemberActionsDropdown` in header
5. Render `GroupSummaryModal` state management
6. Handle leave group logic: show confirmation, call mutation, navigate away on success

**Test**: Navigate to `/groups/[id]` and verify page loads group data.

---

### Step 9: Create GroupDetail Route

**File**: `web/src/routes/groups.$id.tsx`

**Changes**:

1. Create file-based route using TanStack Router naming: `groups.$id.tsx`
2. Define route loader if needed for prefetching
3. Render `GroupDetailPage` component
4. Pass route params to component

**Test**: Navigate to `/groups/[id]` in app; verify route loads without errors.

---

### Step 10: Integrate GroupMemberActionsDropdown in Existing Views

**File**: Update files that display group lists/cards:

- `web/src/pages/MyGroupsPage.tsx` (or similar)
- `web/src/components/group/GroupCard.tsx` (if exists)
- Any other group list/preview components

**Changes**:

1. Import `GroupMemberActionsDropdown` and `GroupSummaryModal`
2. Add dropdown to group card/list item
3. Add modal state management (useState for isOpen)
4. Connect View button to open modal
5. Connect Leave button to mutation via `useGroupActions` hook

**Example**:

```tsx
const [summaryOpen, setSummaryOpen] = useState(false);
const { leaveGroup } = useGroupActions({
  onLeaveSuccess: () => {
    // Refresh list or navigate away
    refetchGroups();
  },
});

return (
  <>
    <GroupMemberActionsDropdown
      groupId={group.id}
      userRole={userRole}
      onViewClick={() => setSummaryOpen(true)}
      onLeaveClick={() => {
        if (confirm("Leave this group?")) {
          leaveGroup.mutate(group.id);
        }
      }}
    />
    <GroupSummaryModal
      groupId={group.id}
      isOpen={summaryOpen}
      onClose={() => setSummaryOpen(false)}
    />
  </>
);
```

---

## Verification Checklist

After completing all steps, verify:

### Backend

- [ ] GroupMember model has `status` and `leftAt` fields
- [ ] Indexes created: `{ groupId: 1, status: 1 }` and `{ leftAt: 1, status: 1 }`
- [ ] `PATCH /api/groups/:id/leave` endpoint works
- [ ] Leaving a group sets status to 'left' with timestamp
- [ ] API errors (404, 403, 409) are handled correctly
- [ ] Audit events are recorded

### Frontend

- [ ] `useGroupActions` hook exists and calls API
- [ ] `GroupMembersList` renders members with avatars and names
- [ ] `GroupSummaryModal` displays all required fields
- [ ] `GroupMemberActionsDropdown` shows correct actions based on role
- [ ] `GroupDetailPage` loads group details
- [ ] Route `/groups/:id` navigates to detail page
- [ ] Leave button shows confirmation and calls API
- [ ] Success toast shown after leaving group
- [ ] Group list refreshes after leaving

### Integration

- [ ] Leaving a group removes user from group member list
- [ ] User cannot see group in "My Groups" after leaving
- [ ] Admin/owner actions still visible to authorized users
- [ ] View modal works for both admins and members
- [ ] Mobile responsive (test on mobile viewport)

---

## Rollback Plan

If issues occur:

1. **Backend model**: Delete new fields from MongoDB via migration tool or manually
2. **Backend routes**: Comment out leave endpoint, restart server
3. **Frontend**: Disable/hide GroupMemberActionsDropdown component, restart dev server
4. **Database**: Revert GroupMember documents to state before leaving

---

## Performance Considerations

- **Member list query**: Filtered by `status: 'active'` should use index (`{ groupId: 1, status: 1 }`)
- **Modal data fetch**: Use TanStack Query caching to avoid duplicate fetches
- **Leave mutation**: Should complete in <500ms (simple update operation)
- **Audit logging**: Run async to not block response

---

## Next Steps After Implementation

1. Run end-to-end tests (manual or automated)
2. Gather user feedback on UI/UX
3. Performance test with 500+ member groups
4. Monitor error logs for edge cases
5. Document known limitations (e.g., grace period for rejoin — if not implemented)

---

## Completeness Checklist

- ✅ 10-step implementation plan provided
- ✅ Each step is independently testable
- ✅ Integration points documented
- ✅ Verification checklist included
- ✅ Rollback plan provided
- ✅ Performance considerations noted
