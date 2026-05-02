# Data Model: Group Member/Admin Management Refactor

**Phase**: Phase 1 Design  
**Date**: May 2, 2026

## Collections

### GroupMember (Updated - Unified Invite + Member)

Single collection handling both invites and accepted members through status tracking.

**Schema**:

```typescript
interface GroupMemberDefinition extends BaseModelBlueprint {
  groupId: ObjectId; // Foreign key to Group
  userId: ObjectId | null; // Foreign key to User (null for email-only invites)
  email: string | null; // Email address (lowercase, used for invites)
  role: "admin" | "member"; // Role in group
  status: "invited" | "accepted" | "declined" | "cancelled" | "removed"; // Lifecycle
  invitedBy: ObjectId; // Who added/invited this member (FK to User)
  invitedAt: Date; // When member was added to group
  acceptedAt: Date | null; // When user accepted invite (if applicable)
}

type GroupMemberDocument = ModelDocument<GroupMemberDefinition>;
```

**Status Lifecycle**:

- `invited` - Pending invitation (can be to userId or email)
- `accepted` - User accepted the invitation and is currently a member
- `declined` - User declined the invitation
- `cancelled` - User accepted, then cancelled their membership
- `removed` - Admin removed the member (record retained for audit)

**Indexes**:

```
Compound:
  { groupId: 1, userId: 1 } UNIQUE (partial, where userId != null)
  { groupId: 1, email: 1 } UNIQUE (partial, where email != null)
  { groupId: 1 }                     // Find all accepted members or pending invites
  { userId: 1 }                      // Find all groups a user is in
  { email: 1 }                       // Lookup by email (for signup/invite conversion)
  { status: 1 }                      // Find by status (pending invites, removed, etc.)
```

Note: Unique indexes are partial to allow null values (userId for email-only invites, email for user-only records).

**Validations**:

- role ∈ ['admin', 'member'] (enum)
- status ∈ ['invited', 'accepted', 'declined', 'cancelled', 'removed'] (enum)
- groupId must be valid ObjectId
- At least one of userId or email must be present (not both null)
- If email present, must be lowercase and valid format
- If userId present, must be valid ObjectId
- invitedBy must be valid ObjectId

**Timestamps**:

- createdAt: Set on creation
- updatedAt: Updated on status/role changes
- invitedAt: When member was added (same as createdAt)
- acceptedAt: When status → 'accepted' (if applicable)

---

### Group (Updated)

Minor updates to support member/invite relationship.

**Schema Changes**:

```typescript
interface GroupDefinition extends BaseModelBlueprint {
  name: string;
  description: string;
  // ... existing fields ...
  // NEW OPTIONAL: memberIds denormalization (for quick lookups)
  memberIds?: ObjectId[]; // Array of accepted member userIds
}
```

**Rationale for denormalization**:

- Optional fields don't break existing data
- Enable quick "who is in this group?" lookups without join
- Keep synchronized via service layer transactions

---

## Relationships & Cardinality

```
User (1)
  └─→ (many) GroupMember (FK: userId)

Group (1)
  └─→ (many) GroupMember (FK: groupId)

GroupMember (N)
  ├─→ (1) Group (via groupId)
  ├─→ (0..1) User (via userId, null for email-only invites)
  └─→ (1) User (via invitedBy, who created the member record)
```

---

## Migration Strategy

### For Existing Groups

1. **Backfill GroupMember.status**:

   ```typescript
   db.groupMembers.updateMany({}, { $set: { status: "accepted" } });
   ```

2. **Create indexes**:

   ```typescript
   ensureGroupMemberIndexes();
   ```

3. **Verify data integrity**:
   - Check no duplicate (groupId, userId) in GroupMember
   - Check no duplicate (groupId, email) in GroupMember
   - Check all rows have either userId or email
   - Sample group member counts before/after

---

## Query Patterns

### Common Queries

**Find all accepted members of a group**:

```javascript
db.groupMembers.find({ groupId, status: "accepted" }).aggregate([
  { $match: { groupId, status: "accepted" } },
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
]);
```

**Find all pending invites for a group**:

```javascript
db.groupMembers.find({ groupId, status: "invited" });
```

**Attach signed-up user to existing invite row**:

```javascript
db.groupMembers.updateOne(
  { email: newUserEmail },
  { $set: { userId: newUserId } },
);
```

**Search for members** (by name or email):

```javascript
db.users
  .find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: query }, // Exact match
    ],
  })
  .limit(10);
```

**Soft-delete a member**:

```javascript
db.groupMembers.updateOne(
  { _id: memberId },
  { $set: { status: "removed", updatedAt: now } },
);
```

---

## Storage Estimates

Assuming 1000 groups, avg 10 members each:

- **GroupMember**: ~15,000 documents (members + invites + removed) × ~220 bytes = ~3.3 MB
- **Total**: <5 MB (negligible)

---

## Type System (Frontend)

```typescript
// From backend
interface GroupMember {
  _id: string;
  userId: string | null;
  groupId: string;
  email: string | null;
  role: "admin" | "member";
  status: "invited" | "accepted" | "declined" | "cancelled" | "removed";
  invitedBy: string;
  invitedAt: string; // ISO date
  acceptedAt: string | null; // ISO date
}

// Merged for form display
interface MemberListItem {
  _id: string;
  identifier: string; // userId or email
  email?: string;
  name?: string; // If existing user
  avatar?: string;
  role: "admin" | "member";
  status: "invited" | "accepted" | "declined" | "cancelled" | "removed";
  isMember: boolean; // Existing user vs invite
}

// Form input
interface MemberInput {
  identifier: string; // userId or email
  role: "admin" | "member";
}
```

---

## Validation Rules (Backend)

### GroupMember

- role must be 'admin' or 'member'
- status must be one of: 'invited', 'accepted', 'declined', 'cancelled', 'removed'
- At least one of userId or email must be present (not both null)
- If userId present, must be valid, existing user
- If email present, must be lowercase and match pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- groupId must be valid, existing group
- invitedBy must be valid user
- (groupId, userId) must be unique (where userId is not null)
- (groupId, email) must be unique (where email is not null)
- Status 'accepted' requires userId to be present
