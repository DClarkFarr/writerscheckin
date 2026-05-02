# Contract: Group Member Management API

**Version**: 1.0  
**Authentication**: Required (Bearer token)  
**Endpoints**:

- `POST /api/groups` - Create group with members
- `PATCH /api/groups/:groupId` - Update group and members
- `DELETE /api/groups/:groupId/members/:memberId` - Remove member
- `PATCH /api/groups/:groupId/members/:memberId/role` - Update member role

---

## POST /api/groups - Create Group with Members

### Request

```json
{
  "name": "Book Club",
  "description": "Weekly fiction book club",
  "address": "123 Main St",
  "startTime": { "hour": 18, "minute": 30 },
  "durationMinutes": 120,
  "publishHoursBefore": 24,
  "notifyAttendanceHoursBefore": 48,
  "recurrenceRule": {
    "frequency": "WEEKLY",
    "byDay": ["MO"]
  },
  "members": [
    {
      "identifier": "507f1f77bcf86cd799439011",
      "role": "admin"
    },
    {
      "identifier": "john.doe@company.com",
      "role": "member"
    },
    {
      "identifier": "507f1f77bcf86cd799439012",
      "role": "member"
    }
  ]
}
```

### Response (201 Created)

```json
{
  "_id": "507f1f77bcf86cd799439099",
  "name": "Book Club",
  "description": "Weekly fiction book club",
  "address": "123 Main St",
  "startTime": { "hour": 18, "minute": 30 },
  "durationMinutes": 120,
  "publishHoursBefore": 24,
  "notifyAttendanceHoursBefore": 48,
  "recurrenceRule": { "frequency": "WEEKLY", "byDay": ["MO"] },
  "members": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439011",
      "email": "creator@company.com",
      "name": "Alice Creator",
      "role": "admin",
      "status": "accepted",
      "avatar": "https://...",
      "joinedAt": "2026-05-02T14:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439100",
      "userId": null,
      "email": "john.doe@company.com",
      "name": null,
      "role": "member",
      "status": "invited",
      "avatar": null,
      "joinedAt": "2026-05-02T14:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439101",
      "userId": "507f1f77bcf86cd799439012",
      "email": "bob@company.com",
      "name": "Bob Member",
      "role": "member",
      "status": "accepted",
      "avatar": "https://...",
      "joinedAt": "2026-05-02T14:30:00Z"
    }
  ],
  "createdAt": "2026-05-02T14:30:00Z",
  "updatedAt": "2026-05-02T14:30:00Z"
}
```

---

## PATCH /api/groups/:groupId - Update Group and Members

### Request

```json
{
  "name": "Book Club (Updated)",
  "members": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "role": "admin"
    },
    {
      "_id": "507f1f77bcf86cd799439100",
      "role": "admin"
    },
    {
      "identifier": "newperson@company.com",
      "role": "member"
    }
  ]
}
```

### Response (200 OK)

```json
{
  "_id": "507f1f77bcf86cd799439099",
  "name": "Book Club (Updated)",
  "members": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439011",
      "email": "alice@company.com",
      "name": "Alice Creator",
      "role": "admin",
      "status": "accepted"
    },
    {
      "_id": "507f1f77bcf86cd799439100",
      "userId": null,
      "email": "john.doe@company.com",
      "name": null,
      "role": "admin",
      "status": "invited"
    },
    {
      "_id": "507f1f77bcf86cd799439102",
      "userId": null,
      "email": "newperson@company.com",
      "name": null,
      "role": "member",
      "status": "invited"
    }
  ],
  "updatedAt": "2026-05-02T15:00:00Z"
}
```

---

## DELETE /api/groups/:groupId/members/:memberId - Remove Member

### Request

```
DELETE /api/groups/507f1f77bcf86cd799439099/members/507f1f77bcf86cd799439011
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Member removed",
  "memberStatus": "removed"
}
```

### Notes

- Sets `GroupMember.status` to `removed` (soft delete)
- Record retained for audit trail
- Member can be re-added later if needed
- Existing user receives notification if enabled

---

## PATCH /api/groups/:groupId/members/:memberId/role - Update Member Role

### Request

```json
{
  "role": "admin"
}
```

### Response (200 OK)

```json
{
  "success": true,
  "_id": "507f1f77bcf86cd799439011",
  "role": "admin",
  "updatedAt": "2026-05-02T15:05:00Z"
}
```

### Error (400 Bad Request)

```json
{
  "error": "Invalid role. Must be 'admin' or 'member'."
}
```

---

## Member Object Structure

### For Existing Users (Active Status)

```json
{
  "_id": "memberId",
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@company.com",
  "name": "John Smith",
  "avatar": "https://cdn.example.com/avatars/507f1f77bcf86cd799439011.jpg",
  "role": "admin" | "member",
  "status": "accepted" | "cancelled" | "removed",
  "invitedAt": "2026-05-02T14:30:00Z",
  "acceptedAt": "2026-05-02T14:35:00Z"
}
```

### For Invited Users (Pending Status)

```json
{
  "_id": "inviteId",
  "userId": null,
  "email": "unknown@company.com",
  "name": null,
  "avatar": null,
  "role": "admin" | "member",
  "status": "invited" | "declined" | "removed",
  "invitedAt": "2026-05-02T14:30:00Z",
  "acceptedAt": null
}
```

---

## Validation Rules

- **role**: Must be "admin" or "member"
- **identifier**: Either valid userId (ObjectId) or valid email address
- **members array**: No duplicates allowed (same userId or email)
- **Email format**: Must match `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- **Removed members**: Can be re-added; status will be updated back to `invited` or `accepted` as appropriate

## Error Responses

### 400 Bad Request

```json
{
  "error": "Duplicate member: user already in group"
}
```

### 403 Forbidden

```json
{
  "error": "Only group admins can modify membership"
}
```

### 404 Not Found

```json
{
  "error": "Group not found"
}
```

### 409 Conflict

```json
{
  "error": "Cannot remove last admin from group"
}
```

## Implementation Notes

- All operations require group admin privileges
- Optimistic updates on client: modify UI immediately, revert on error
- Email sent to invited users (async, doesn't block response)
- Status changes logged for audit trail
- Rate limit: 100 requests/minute per user
