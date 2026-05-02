# Quickstart: Group Member/Admin Management Refactor

**Phase**: Phase 1 Design  
**Date**: May 2, 2026

## Feature Overview

This refactor unifies member/admin management into a single smart search flow:

1. **Single Add Member Flow**: Replace separate "Add Admin" / "Add Member" selects with one unified input
2. **Smart Search**: Debounced (250ms), 2+ character minimum, matches by name or exact email
3. **Email Invites**: Invite non-registered users by email; converts to member when they sign up
4. **Role Management**: Select role (Admin/Member) after member selection; change anytime
5. **Smart Display**: Show avatar+name for existing users, email for pending invites
6. **Quick Actions**: Role selector + delete button on each selected member

## User Journeys

### Journey 1: Create New Group (Add Members)

```
1. User opens "Create Group" form
2. Fills in group details (name, description, etc.)
3. Clicks "Add Member" input
4. Starts typing name or email (≥2 characters)
5. Search results appear (debounced 250ms)
6. Selects member from dropdown
7. Member appears in selected list with default "Member" role
8. User clicks role selector → changes to "Admin"
9. Repeats steps 3-8 to add more members
10. Clicks "Create Group"
11. All members receive email invite (existing users) or email is recorded as pending invite
```

### Journey 2: Edit Group (Modify Members)

```
1. User opens existing group edit page
2. Current members/admins appear in unified list
3. User can:
   a. Add new member (same as Journey 1, steps 3-9)
   b. Change existing member role (click role selector → select new role)
   c. Remove member (click X button → member deleted via API, status='removed')
4. Clicks "Save" → all changes persisted
```

### Journey 3: Invite Unknown Email

```
1. User types unknown email (e.g., "newperson@company.com") in search
2. Search returns no results
3. System shows "Invite newperson@company.com" option
4. User clicks invite option
5. Email appears in selected list as invite
6. User assigns role (Admin/Member)
7. Form submitted → invite created, email sent
8. When person signs up with that email → automatically becomes group member
```

## Component Usage Example

```tsx
// In group create/edit form
import { GroupMemberSelect } from '@/components/GroupMemberSelect'

function GroupForm({ groupId }) {
  const isEditMode = !!groupId
  const [members, setMembers] = useState<MemberInput[]>([])

  return (
    <form onSubmit={handleSubmit}>
      <label>Group Name</label>
      <input type="text" ... />

      <label>Add Members</label>
      <GroupMemberSelect
        groupId={groupId}
        value={members}
        onChange={setMembers}
        disabled={isSubmitting}
      />

      <button type="submit">
        {isEditMode ? 'Update Group' : 'Create Group'}
      </button>
    </form>
  )
}
```

## API Endpoints Quick Reference

### Member Search

```
GET /api/members/search?q=john&groupId=abc123&limit=10

Response:
{
  results: [
    { _id: "userid1", name: "John Smith", email: "john@...", avatar: "url" },
    { _id: "userid2", name: "John Doe", email: "john.doe@...", avatar: "url" }
  ],
  inviteOption: {
    email: "john@newmail.com",
    suggested: true
  } || null
}
```

### Create/Update Group

```
POST /api/groups
PATCH /api/groups/:groupId

Request:
{
  name: "Group Name",
  members: [
    { identifier: "userid", role: "admin" },
    { identifier: "email@domain.com", role: "member" }
  ],
  ... other fields ...
}
```

### Update Member Role

```
PATCH /api/groups/:groupId/members/:memberId
{
  role: "admin" | "member"
}
```

### Remove Member

```
DELETE /api/groups/:groupId/members/:memberId

Sets member status to 'removed' (soft delete)
```

## Data Model Summary

**GroupMember** (unified for invited and accepted members):

- groupId, userId (nullable), email (nullable), role, status
- Status: invited → accepted | declined | cancelled | removed
- Unique: (groupId, userId) where userId exists; (groupId, email) where email exists
- Stores invitedBy, invitedAt, and acceptedAt on the same row

**Group**:

- Links to many GroupMembers
- Optional denormalization: memberIds array

## Frontend Architecture

```
GroupMemberSelect (Container)
├── MemberSearchInput (Debounced search)
│   └── uses useMemberSearch hook
│       └── uses useQuery (TanStack Query)
├── SelectedMembersList
│   └── SelectedMemberItem (Each member)
│       ├── Avatar (if existing user)
│       ├── Name or Email
│       ├── RoleSelector dropdown
│       └── Delete (X) button
└── InviteOption (if shown)
    └── "Invite email@domain.com"
```

## Backend Architecture

```
Router (groupsRouter, membersRouter)
├── POST /groups (create with members)
├── PATCH /groups/:id (update)
├── GET /members/search
├── DELETE /groups/:id/members/:mid
└── PATCH /groups/:id/members/:mid/role

Services
├── groupsService
├── groupMembersService (addMember, removeMember, updateRole, attachUserToInvitedMember)
└── memberSearchService (search, validate, invite check)

Models
├── Group
└── GroupMember
```

## Key Implementation Details

1. **Debouncing**: 250ms on frontend; never query < 2 characters
2. **Search**: Partial name match OR exact email match
3. **Invites**: Email-based until user signs up; then the same row is linked to `userId`
4. **Delete**: Local-only in create mode; API call in edit mode (status='removed')
5. **Role**: Enum (admin/member); set at add time; changeable anytime
6. **Display**: Avatar+name for users; email for invites
7. **Optimistic**: UI updates immediately; reverts on error

## Testing Checklist

- [ ] Search debounces correctly (no requests in first 250ms)
- [ ] Search requires 2+ characters
- [ ] Search matches partial names
- [ ] Search matches exact emails
- [ ] Invite option shows for unknown email + valid format
- [ ] Delete works in create mode (local only)
- [ ] Delete works in edit mode (API call, status='removed')
- [ ] Role selector changes role immediately
- [ ] Form submit includes correct member array
- [ ] Existing members load correctly in edit mode
- [ ] Avatar displays for existing users
- [ ] Email displays for invites

## Deployment Checklist

- [ ] Create GroupMember collection with indexes
- [ ] Backfill GroupMember.status = 'accepted'
- [ ] Deploy backend services
- [ ] Deploy API endpoints
- [ ] Deploy frontend components
- [ ] Test end-to-end on staging
- [ ] Monitor error logs post-deploy

## Files to Create/Modify

### Backend

- `express/src/models/groupMembers.ts` (update)
- `express/src/services/groupMembersService.ts` (update)
- `express/src/services/memberSearchService.ts` (new)
- `express/src/routers/membersRouter.ts` (new)
- `express/src/routers/groupsRouter.ts` (update)

### Frontend

- `web/src/components/GroupMemberSelect/GroupMemberSelect.tsx` (new)
- `web/src/components/GroupMemberSelect/MemberSearchInput.tsx` (new)
- `web/src/components/GroupMemberSelect/SelectedMemberItem.tsx` (new)
- `web/src/components/GroupMemberSelect/MemberSelectOption.tsx` (new)
- `web/src/hooks/useMemberSearch.ts` (new)
- `web/src/queries/memberQueries.ts` (new)
- `web/src/components/GroupForm/GroupForm.tsx` (update)
- `web/src/utils/emailValidation.ts` (new)

## Documentation Updates

- `specs/007-group-member-admin-refactor/plan.md` ← You are here
- Update relevant .md docs in project repo (API docs, data model docs)
