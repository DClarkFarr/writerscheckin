# Implementation Plan: Group Member/Admin Management Refactor

**Branch**: `007-group-member-admin-refactor` | **Date**: May 2, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-group-member-admin-refactor/spec.md`

## Summary

Unified member/admin management flow for group creation and editing. Refactor the current dual "Select Admins"/"Select Members" dropdowns into a single smart member search with debounced 250ms queries, support for email invites to non-registered users, and immediate role assignment (Admin/Member). The backend will use a single `GroupMember` record for both invites and accepted members, with statuses `invited`, `accepted`, `declined`, `cancelled`, and `removed`. When a user signs up with an invited email, the same record is updated with `userId` instead of creating a separate invite model. Frontend form behavior stays split by mode: create mode removes locally, edit mode calls the remove endpoint immediately.

## Technical Context

**Language/Version**: TypeScript 5.x (both Express and React)  
**Backend**: Express 5, MongoDB (native driver), bcryptjs, Nodemailer  
**Frontend**: React 19, Vite 8, TanStack Router, TanStack Query v5, Zustand, react-select, Tailwind CSS v4, ShadCN UI  
**Storage**: MongoDB (`groupMembers` collection, existing `groups` collection)  
**Testing**: Manual testing; integration endpoints; component testing  
**Target Platform**: Web (monorepo with Express backend + React SPA)
**Project Type**: Web-service (full-stack group management feature)  
**Performance Goals**: Member search <500ms; form submission <1s; debounce reduces queries by 80%+  
**Constraints**: Optimistic UI updates required; offline state handling for form; email validation before invite creation  
**Scale/Scope**: Single feature affecting group creation/edit flows; 1 updated membership collection; ~10 new/modified endpoints; custom react-select component

## Constitution Check

**GATE RESULT**: ✅ PASS (all principles met)

| Principle                                     | Status  | Notes                                                                                         |
| --------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| Strict TypeScript                             | ✅ PASS | All new code will use strict mode; no `any` types                                             |
| Layered Backend (Models → Services → Routers) | ✅ PASS | GroupMember model in layer 1; business logic in services; endpoints in routers                |
| Model-only MongoDB access                     | ✅ PASS | All collection operations remain isolated in `models/groupMembers.ts` and related model files |
| Service layer business logic                  | ✅ PASS | Invite status tracking, email validation, role assignment logic in services                   |
| React component patterns                      | ✅ PASS | Custom react-select component with ShadCN UI; TanStack Query for member search                |
| Path aliases                                  | ✅ PASS | Frontend code uses `@/` alias for imports                                                     |
| dayjs for dates                               | ✅ PASS | All date operations use dayjs from centralized utility                                        |

## Project Structure

### Documentation (this feature)

```text
specs/007-group-member-admin-refactor/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Entity schemas & relationships
├── quickstart.md        # Phase 1: Getting started guide
├── contracts/
│   └── member-search-api.md    # Member search API contract
│   └── group-update-api.md     # Group create/update API contract
└── checklists/
    └── requirements.md   # Specification checklist
```

### Source Code (monorepo layout)

```text
express/
├── src/
│   ├── models/
│   │   ├── groups.ts              # (update) Reference memberIds for denormalization
│   │   ├── groupMembers.ts        # (update) Add email, invitedBy, acceptedAt, status field
│   │   └── types.ts               # (existing) Type system
│   ├── services/
│   │   ├── groupsService.ts       # (update) Refactor create/update with new member flow
│   │   ├── groupMembersService.ts # (new) Member CRUD, invite creation, status tracking
│   │   └── memberSearchService.ts # (new) Member search logic & email validation
│   └── routers/
│       ├── groupsRouter.ts        # (update) create/update endpoints with new schema
│       └── membersRouter.ts       # (new) member search, add, delete, role update endpoints

web/
├── src/
│   ├── components/
│   │   ├── GroupMemberSelect/
│   │   │   ├── GroupMemberSelect.tsx        # (new) Main component with search & selected list
│   │   │   ├── MemberSearchInput.tsx        # (new) Debounced search input
│   │   │   ├── SelectedMemberItem.tsx       # (new) Selected member with role & delete
│   │   │   ├── MemberSelectOption.tsx       # (new) Custom option with avatar
│   │   │   └── MemberSelectStyles.ts        # (new) Styling & theme customization
│   │   └── GroupForm/
│   │       └── GroupForm.tsx                # (update) Use GroupMemberSelect component
│   ├── hooks/
│   │   └── useMemberSearch.ts              # (new) Debounced member search hook with TanStack Query
│   ├── queries/
│   │   └── memberQueries.ts                # (new) TanStack Query definitions for member search
│   └── utils/
│       └── emailValidation.ts              # (new) Email validation utilities
```

**Structure Decision**: Monorepo with strict layer separation. Backend follows Models → Services → Routers pattern. Frontend uses custom react-select component with hooks for debounced search. All member operations isolated in dedicated files.

## Complexity Tracking

No constitution violations. All architectural patterns align with project standards.

---

# Phase 0: Research

## Research Questions

Based on the technical context and spec, the following clarifications have been addressed in planning:

### Q1: Email Invite vs Role-Based Invites

**RESOLVED**: Invites are role-based (Admin or Member) at creation time. Email is the primary identifier until a user account exists, then the same `GroupMember` record is updated with `userId`. Status tracking uses `invited`, `accepted`, `declined`, `cancelled`, and `removed`.

### Q2: Optimistic UI Updates for Invites

**RESOLVED**: Frontend follows standard pattern using TanStack Query's optimistic update capability. Cache invalidation triggered on form submit. Member list reflects changes immediately before network confirmation.

### Q3: Search Query Performance

**RESOLVED**: 250ms debounce with 2+ character minimum reduces database queries by ~80%. Search matches against `full_name` (indexed) and `email` (indexed, exact match only).

### Q4: Delete Behavior in Create vs Edit Mode

**RESOLVED**:

- **Create mode**: Delete removes item from local form state only (not sent to server)
- **Edit mode**: Delete triggers DELETE endpoint, which sets `status: 'removed'` but retains record for audit trail

### Q5: Email Validation Before Invite

**RESOLVED**: Frontend validates email format before showing invite option. Backend re-validates before creating GroupMember record.

---

# Phase 1: Design

## 1.1 Data Model

### Entities

**GroupMember** (updated)

```
- _id: ObjectId
- groupId: ObjectId (indexed)
- email: String (indexed, lowercase)
- userId: ObjectId | null  [populated when user signs up]
- role: 'admin' | 'member'
- status: 'invited' | 'accepted' | 'declined' | 'cancelled' | 'removed'
- invitedBy: ObjectId
- invitedAt: Date
- acceptedAt: Date | null
- updatedAt: Date
- createdAt: Date
```

**Group** (Refactor existing)

```
- _id: ObjectId
- name: String
- description: String
- [... existing fields ...]
- memberIds: ObjectId[] [denormalized for quick lookups]
- updatedAt: Date
- createdAt: Date
```

### Relationships

```
Group
└── many-to-many → GroupMember (via groupId, userId/email)

User (existing)
└── many → GroupMember (via userId, for accepted/declined/cancelled statuses)
```

### Validations & Constraints

- Email MUST be lowercase and valid format (if present)
- At least one of userId or email MUST be present (not both null)
- role MUST be 'admin' or 'member'
- status can be: invited, accepted, declined, cancelled, removed
- Duplicate prevention: unique index on (groupId, userId) where userId exists; unique index on (groupId, email) where email exists

### Indexes Required

```
GroupMember
- { groupId: 1, userId: 1 } unique (partial, where userId != null)
- { groupId: 1, email: 1 } unique (partial, where email != null)
- { groupId: 1 }
- { userId: 1 }
- { email: 1 }
- { status: 1 }
```

---

## 1.2 API Contracts

### POST /api/groups (Create Group with Members)

**Request**:

```json
{
  "name": "string",
  "description": "string",
  "members": [
    {
      "identifier": "userId or email",
      "role": "admin | member"
    }
  ],
  "... other group fields ..."
}
```

**Response**:

```json
{
  "_id": "ObjectId",
  "name": "string",
  "members": [
    {
      "_id": "ObjectId",
      "userId": "ObjectId or null",
      "email": "string or null",
      "role": "admin | member",
      "status": "invited | accepted"
    }
  ],
  "... other fields ..."
}
```

### PATCH /api/groups/:groupId (Update Group Members)

**Request**:

```json
{
  "members": [
    {
      "_id": "memberId (for existing)",
      "identifier": "userId or email (for new)",
      "role": "admin | member"
    }
  ]
}
```

### GET /api/members/search?q=query

**Query Params**:

- `q`: search query (name or email), minimum 2 characters
- `groupId`: optional, to exclude already-added members
- `limit`: optional, default 10

**Response**:

```json
{
  "results": [
    {
      "_id": "userId",
      "name": "full name",
      "email": "email@domain.com",
      "avatar": "url or null"
    }
  ],
  "inviteOption": {
    "email": "unknown@domain.com",
    "suggested": true
  } || null
}
```

### DELETE /api/groups/:groupId/members/:memberId

Sets GroupMember.status to 'removed' (soft delete, record retained).

**Response**: `{ success: true }`

### PATCH /api/groups/:groupId/members/:memberId

**Request**:

```json
{
  "role": "admin | member"
}
```

---

## 1.3 Frontend Components

### GroupMemberSelect Component

- **Purpose**: Unified member add + role management component
- **Props**:
  - `groupId?: string` (null if creating)
  - `value: Array<{ identifier, role }>`
  - `onChange: (value) => void`
  - `disabled?: boolean`
- **Behavior**:
  - Renders search input + selected members list
  - Search is debounced 250ms; requires 2+ characters
  - Shows invite option for unknown emails
  - Each selected member has role selector + delete button
  - Delete behavior differs: create mode = local removal; edit mode = API call

### MemberSearchInput

- **Debounce**: 250ms
- **Minimum chars**: 2
- **Matching**: Partial name OR full email match
- **Results**: Show max 10 results; invite option if no matches + valid email

### SelectedMemberItem

- **Display**: Avatar + name (for existing user) OR email (for invite)
- **Role selector**: Dropdown (Admin/Member)
- **Delete**: X button → remove from list or call API based on mode

---

## 1.4 Service Layer (Backend)

### groupMembersService

- `addMember(groupId, identifier, role, invitedBy)` - Validate, create GroupMember with status='invited'
- `removeMember(groupId, memberId)` - Soft delete (status='removed')
- `updateMemberRole(groupId, memberId, role)` - Update role
- `updateMemberStatus(groupId, memberId, newStatus)` - Advance lifecycle to accepted, declined, cancelled, or removed
- `getMembersByGroupId(groupId, statusFilter)` - Get members by group and optional status filter
- `getMemberByEmail(groupId, email)` - Lookup pending invite by email
- `attachUserToInvitedMember(email, userId)` - Update invited email row with `userId` when signup completes
- `preventDuplicates(groupId, identifier)` - Check if already added

### memberSearchService

- `searchMembers(query, groupId)` - Backend search matching by name or email
- `validateEmail(email)` - Email format validation
- `shouldShowInviteOption(query)` - Check if valid email + no matches found

---

## 1.5 State Management (Frontend)

### Form State (Zustand store or local React state)

```typescript
{
  members: Array<{
    _id?: string; // Existing member ID (if edit mode)
    identifier: string; // userId or email
    role: "admin" | "member";
    status: "invited" | "accepted" | "declined" | "cancelled" | "removed"; // For display
    avatar?: string; // For display
    name?: string; // For display
  }>;
  isSubmitting: boolean;
  errors: Record<string, string>;
}
```

### TanStack Query Setup

- **Query key**: `['members', 'search', query, groupId]`
- **Stale time**: 5 minutes
- **Cache time**: 10 minutes
- **Debounce**: Client-side 250ms before firing query

---

# Phase 2: Implementation Details

## High-Level Implementation Flow

### Backend (Express + MongoDB)

1. **Create models**:

- Update `GroupMember` model schema to support both invited and accepted members
- Add fields for `email`, `invitedBy`, `invitedAt`, and `acceptedAt`

2. **Create services**:
   - `groupMembersService`: handle member operations
   - `memberSearchService`: search + validation logic

3. **Create/update routers**:
   - `POST /api/groups` - accept new `members` array with identifiers
   - `PATCH /api/groups/:groupId` - update members with new invite flow
   - `GET /api/members/search?q=query` - smart search with email invite option
   - `DELETE /api/groups/:groupId/members/:memberId` - soft delete (set status='removed')
   - `PATCH /api/groups/:groupId/members/:memberId/role` - update member role

4. **Update auth middleware**:
   - Ensure only group creators/admins can modify membership

### Frontend (React + Vite)

1. **Create custom components**:
   - `GroupMemberSelect.tsx` - Main container component
   - `MemberSearchInput.tsx` - Debounced search with react-select
   - `SelectedMemberItem.tsx` - Selected member display with actions
   - `MemberSelectOption.tsx` - Custom react-select option with avatar
   - `MemberSelectStyles.ts` - Styling configuration

2. **Create hooks**:
   - `useMemberSearch.ts` - Hook wrapping TanStack Query with 250ms debounce

3. **Create queries**:
   - `memberQueries.ts` - TanStack Query definitions
   - `useMemberSearchQuery(query, groupId)` - Returns data, isLoading, error
   - `useGroupQuery(groupId)` - For loading current members in edit mode

4. **Update form**:
   - Replace separate admin/member selects with `<GroupMemberSelect />`
   - Handle form submission with optimistic updates
   - Different delete behavior for create vs edit mode

5. **Add utilities**:
   - Email validation (format check before showing invite option)
   - Avatar display logic
   - Status display logic (existing user vs invite)

### Data Migration (if upgrading existing groups)

- Set `GroupMember.status = 'accepted'` for all current members
- Backfill `email`, `invitedBy`, and `acceptedAt` as needed for older rows
- Create or update partial indexes on `groupMembers`

---

## Key Implementation Notes

### Debouncing Strategy

```typescript
// Frontend
useMemberSearch(query) {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timeoutRef = useRef<number>();

  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery('');
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  return useMemberSearchQuery(debouncedQuery, groupId);
}
```

### Delete Mode Detection

```typescript
// Frontend
const isCreateMode = !groupId;

const handleDeleteMember = (memberId) => {
  if (isCreateMode) {
    // Remove from local state only
    setMembers((m) => m.filter((x) => x._id !== memberId));
  } else {
    // Call DELETE endpoint
    deleteMember.mutate({ groupId, memberId });
  }
};
```

### Optimistic Updates

```typescript
// Frontend (TanStack Query)
const deleteMember = useMutation(
  (params) =>
    api.delete(`/groups/${params.groupId}/members/${params.memberId}`),
  {
    onMutate: (variables) => {
      // Update cache immediately
      queryClient.setQueryData(["group", groupId], (old) => ({
        ...old,
        members: old.members.filter((m) => m._id !== variables.memberId),
      }));
    },
    onError: (error, variables, context) => {
      // Revert on error
      queryClient.invalidateQueries(["group", groupId]);
    },
  },
);
```

---

## Testing Checklist

- [ ] Backend: Create GroupMember with email, verify status='invited'
- [ ] Backend: Attach a signed-up user to an invited GroupMember row
- [ ] Backend: Prevent duplicate members (same userId or email)
- [ ] Backend: Search returns results in <500ms for 10k users
- [ ] Backend: Search matches partial names and exact emails
- [ ] Frontend: Search debounces correctly (no queries before 250ms idle)
- [ ] Frontend: Search requires 2+ characters
- [ ] Frontend: Invite option appears only for valid emails with no matches
- [ ] Frontend: Create mode deletes are local-only
- [ ] Frontend: Edit mode deletes call API and update status to 'removed'
- [ ] Frontend: Avatar displays for existing users
- [ ] Frontend: Email displays for invites
- [ ] Frontend: Role selector works for both existing and invite members
- [ ] Frontend: Form submission includes members array with correct structure
- [ ] End-to-end: Create group with members and invites
- [ ] End-to-end: Edit group, add/remove members, change roles
- [ ] End-to-end: Invited email row is linked to a user account when that user signs up

---

## Dependencies & Integration Points

- **Email validation**: Use existing email-validator or simple regex (project convention)
- **Avatar display**: Leverage existing avatar system from Users model
- **Auth**: Ensure only group creator/admin can manage members
- **Search indexing**: Ensure `users.name` and `users.email` have indexes
- **Soft delete pattern**: Consistent with existing `deletedAt` pattern in project

---

## Risk Mitigation

| Risk                                  | Mitigation                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Duplicate member entries              | Unique indexes + preventDuplicates check before add                             |
| Performance on large search queries   | Debounce 250ms + min 2 chars + indexed search fields                            |
| Invite email spam                     | Verify email format + rate limit on invite creation                             |
| User signs up after removed as member | Restore membership when re-adding same user                                     |
| Incorrect role assignment in bulk     | Validate role enum on server-side before save                                   |
| Cache invalidation issues             | Use TanStack Query invalidation after mutations                                 |
| Backward compatibility                | Preserve existing GroupMember rows and migrate them to unified lifecycle fields |

---

# Phase 2: Task Generation

Tasks will be generated by `/speckit.tasks` after this plan is approved.

**Task execution order** (Dependencies):

1. Backend model (update GroupMember)
2. Backend services (groupMembersService, memberSearchService)
3. Backend routers/endpoints
4. Frontend components (custom react-select)
5. Frontend form integration
6. Testing & bug fixes

---

# Next Steps

1. ✅ Plan complete (this document)
2. → `/speckit.tasks` - Generate actionable task list
3. → `/speckit.implement` - Execute implementation tasks
4. → `/speckit.analyze` - Quality review after implementation
