# Data Model: Group Actions UI

**Created**: 2026-05-02  
**Feature**: [Group Actions UI](../spec.md)  
**Research**: [research.md](research.md)

## Overview

This feature leverages the existing GroupMember model's invite status system to track when a user leaves a group. When a user leaves, the `invite.status` is set to `'cancelled'` and `invite.statusChangedAt` is updated to the current timestamp, enabling non-destructive leave operations with full audit trail.

---

## Entity Definitions

### GroupMember (Using Existing Invite System)

Represents a user's membership in a group with invite status tracking.

**Schema** (showing invite-related fields only):

| Field                    | Type          | Required | Notes                                                                             |
| ------------------------ | ------------- | -------- | --------------------------------------------------------------------------------- |
| `_id`                    | ObjectId      | Yes      | MongoDB auto-generated                                                            |
| `groupId`                | ObjectId      | Yes      | Reference to Group                                                                |
| `userId`                 | ObjectId      | Yes      | Reference to User                                                                 |
| `role`                   | string (enum) | Yes      | `'owner'` \| `'admin'` \| `'member'`                                              |
| `invite.invitedBy`       | ObjectId      | Yes      | User ID who sent the invite                                                       |
| `invite.invitedAt`       | Date          | Yes      | When the invite was sent                                                          |
| `invite.invitedUser`     | ObjectId      | Yes      | Target user of the invite                                                         |
| `invite.status`          | string (enum) | Yes      | **USED FOR LEAVE** — `'invited'` \| `'accepted'` \| `'declined'` \| `'cancelled'` |
| `invite.statusChangedAt` | Date          | Yes      | **UPDATED ON LEAVE** — When status last changed (includes when user leaves)       |
| `deletedAt`              | Date \| null  | No       | Soft-delete marker (null if active)                                               |
| `createdAt`              | Date          | Yes      | Record creation time                                                              |
| `updatedAt`              | Date          | Yes      | Last update time                                                                  |

**Validation Rules**:

- `invite.status: 'accepted'` means user is actively a member (when `deletedAt` is null)
- `invite.status: 'cancelled'` means user left the group (set by leave action)
- `invite.status: 'invited'` means user has not yet accepted
- `invite.status: 'declined'` means user rejected the invitation
- User can leave the group themselves (sets `invite.status: 'cancelled'` and updates `invite.statusChangedAt`)
- Only users with `invite.status: 'accepted'` and `deletedAt: null` are considered "active members"
- Querying for "active members" MUST use `{ invite: { status: 'accepted' }, deletedAt: null }`

**State Transitions for Leave Action**:

```
'accepted' → 'cancelled' (user action: leave group)
- Sets: invite.statusChangedAt = new Date()
- Does NOT change: role, deletedAt (remains null)
```

**Indexes** (performance optimization):

```javascript
{
  groupId: 1,
  role: 1,
  deletedAt: 1  // For filtering active members by role
}

{
  groupId: 1,
  userId: 1,
  unique: true  // Prevent duplicate memberships
}

{
  groupId: 1,
  role: 1,
  unique: true,  // Only one active owner per group
  partialFilterExpression: {
    role: 'owner',
    deletedAt: null
  }
}
```

---

### Group (Unchanged)

Group entity is conceptually unchanged; relationship changes through GroupMember filtering.

**Key constraint for this feature**:

- When querying "active members of group", MUST filter GroupMembers with `invite.status: 'accepted'` AND `deletedAt: null`
- Do NOT count or display members with `invite.status: 'cancelled'`

---

### User (Unchanged)

User entity is unchanged. Used for ownership and membership queries.

---

## Data Access Patterns

### Query: Get Active Members of a Group

```typescript
// MongoDB query
db.groupMembers.find({
  groupId: ObjectId("..."),
  invite: { status: "accepted" },
  deletedAt: null,
});

// Service function (express/src/models/groupMembers.ts):
async function listGroupMembersByGroupId(
  groupId: string,
  options?: { includeDeleted?: boolean; limit?: number },
): Promise<GroupMemberDocument[]> {
  const collection = getGroupMembersCollection();
  return collection
    .find({
      groupId: ensureObjectId(groupId),
      ...(options?.includeDeleted ? {} : { deletedAt: { $exists: false } }),
    })
    .toArray();
}

// Filter results to active members:
const activeMembers = members.filter((m) => m.invite.status === "accepted");
```

### Query: Check User Membership Status

```typescript
// Service function
async function getUserGroupMembership(
  userId: string,
  groupId: string,
): Promise<GroupMemberDocument | null> {
  const collection = getGroupMembersCollection();
  return collection.findOne({
    userId: ensureObjectId(userId),
    groupId: ensureObjectId(groupId),
    deletedAt: null, // Active record
  });
}
```

### Mutation: User Leaves Group

```typescript
// Service function (express/src/services/groupsService.ts)
async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const membership = await getUserGroupMembership(userId, groupId);

  if (!membership) {
    throw new Error("not found");
  }

  if (membership.invite.status !== "accepted") {
    throw new Error("User is not an active member");
  }

  // Update invite status to 'cancelled' and mark timestamp
  await updateGroupMemberById(membership._id, {
    invite: {
      status: "cancelled",
      statusChangedAt: new Date(),
    },
  });
}
```

---

## API Response Shapes

### GET /api/groups/:id/summary

```json
{
  "id": "group-id",
  "name": "Mystery Writers Circle",
  "description": "A group for mystery novel writers",
  "recurrence": "weekly",
  "time": "19:00",
  "owner": {
    "id": "user-id",
    "name": "Jane Doe"
  },
  "members": [
    { "id": "user-1", "name": "Alice" },
    { "id": "user-2", "name": "Bob" }
  ]
}
```

### PATCH /api/groups/:id/leave

**Success Response** (200):

```json
{
  "success": true,
  "message": "You have left the group"
}
```

**Error Response** (403 — not a member):

```json
{
  "error": "You are not a member of this group",
  "code": "NOT_A_MEMBER"
}
```

---

## Migration Notes (if applicable)

**For existing data**:

If GroupMember records exist that need migration, ensure:

```javascript
// All active members should have:
db.groupMembers.updateMany(
  { invite: { status: "accepted" }, deletedAt: null },
  {
    $set: {
      // Records are already in correct state
      // Just verify with query below
    },
  },
);

// Verify active member filter works:
db.groupMembers
  .find({
    groupId: ObjectId("..."),
    invite: { status: "accepted" },
    deletedAt: null,
  })
  .count();
```

---

## Completeness Checklist

- ✅ Entity definitions with all fields (invite object with status and statusChangedAt)
- ✅ Invite status values documented (including 'cancelled')
- ✅ State transitions for leave action defined
- ✅ Indexes for performance documented
- ✅ Query patterns for active members documented
- ✅ Mutation pattern for leave action documented (uses invite.status and invite.statusChangedAt)
- ✅ API response shapes defined
- ✅ Migration notes provided
