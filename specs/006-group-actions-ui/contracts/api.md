# Contract: REST API

**Created**: 2026-05-02  
**Feature**: [Group Actions UI](../spec.md)

## Overview

This contract defines the HTTP endpoints required to support group actions UI, specifically the "leave group" operation and group summary retrieval.

---

## Endpoints

### 1. Leave Group

**Method**: `PATCH`  
**Path**: `/api/groups/:id/leave`  
**Authentication**: Required (must be authenticated user)  
**Rate Limit**: Standard rate limit (not auth-protected endpoint, so typical 100 req/min)

#### Request

**Headers**:

```
Authorization: Bearer <session-cookie>
Content-Type: application/json
```

**Path Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Group ID (MongoDB ObjectId as string) |

**Body**: None (user identity comes from session)

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "message": "You have left the group"
}
```

**Error Responses**:

| Status | Code           | Message                              | Cause                                                       |
| ------ | -------------- | ------------------------------------ | ----------------------------------------------------------- |
| 401    | `UNAUTHORIZED` | "Authentication required"            | User not authenticated                                      |
| 403    | `FORBIDDEN`    | "You are not a member of this group" | User is not an active member (invite.status !== 'accepted') |
| 404    | `NOT_FOUND`    | "Group not found"                    | Group ID does not exist                                     |
| 409    | `CONFLICT`     | "You have already left this group"   | invite.status is already 'cancelled'                        |

#### Side Effects

- GroupMember document is updated: `invite.status: 'cancelled'`, `invite.statusChangedAt: <current timestamp>`
- `updatedAt` timestamp is refreshed
- User is removed from active member list in subsequent queries (filtered by `invite.status: 'accepted'`)
- Audit event recorded: `{ action: 'user_left_group', userId, groupId, timestamp }`
- (Optional) User's "my groups" list is refreshed on frontend

---

### 2. Get Group Summary (Optional, for optimization)

This endpoint is optional — UI can use existing group data and apply member filtering on frontend. Included here if backend optimization is needed.

**Method**: `GET`  
**Path**: `/api/groups/:id/summary`  
**Authentication**: Required  
**Rate Limit**: Standard (public endpoint)

#### Request

**Path Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Group ID |

**Query Parameters**: None

#### Response

**Success (200 OK)**:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Mystery Writers Circle",
  "description": "A group for mystery novel writers to discuss craft and share work",
  "recurrence": "weekly",
  "time": "19:00",
  "owner": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "members": [
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Alice",
      "email": "alice@example.com"
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "name": "Bob",
      "email": "bob@example.com"
    }
  ],
  "memberCount": 3,
  "createdAt": "2026-04-01T12:00:00Z"
}
```

**Error Responses**:

| Status | Code           | Message                                | Cause                   |
| ------ | -------------- | -------------------------------------- | ----------------------- |
| 401    | `UNAUTHORIZED` | "Authentication required"              | User not authenticated  |
| 403    | `FORBIDDEN`    | "You do not have access to this group" | User is not a member    |
| 404    | `NOT_FOUND`    | "Group not found"                      | Group ID does not exist |

#### Notes

- Only active members are included in `members` array (filtered by `invite.status: 'accepted'` and `deletedAt: null`)
- Response includes owner information for display in summary
- `memberCount` reflects active members only

---

## Implementation in Express

### Router Setup (express/src/routers/groupsRouter.ts)

```typescript
import { Router } from "express";
import { handleAsync } from "@/utils/asyncHandler";
import { leaveGroup } from "@/services/groupsService";
import { requireAuthSession } from "@/utils/middlewares"; // existing

const groupsRouter = Router({ mergeParams: true });

// Existing routes...

// NEW: Leave group
groupsRouter.patch(
  "/:id/leave",
  requireAuthSession,
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId; // from AuthSession

    await leaveGroup(id, userId);

    res.json({
      success: true,
      message: "You have left the group",
    });
  }),
);

// OPTIONAL: Get group summary
groupsRouter.get(
  "/:id/summary",
  requireAuthSession,
  handleAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;

    const summary = await getGroupSummary(id, userId);
    res.json(summary);
  }),
);

export default groupsRouter;
```

### Service Implementation (express/src/services/groupsService.ts)

```typescript
export async function leaveGroup(
  groupId: string,
  userId: string,
): Promise<void> {
  const membership = await getUserGroupMembership(userId, groupId);

  if (!membership) {
    throw new Error("not found"); // Caught by errorHandler → 404
  }

  if (membership.invite.status !== "accepted") {
    const error = new Error("You have already left this group");
    (error as any).status = 409;
    throw error;
  }

  // Update invite status to 'cancelled' and mark timestamp
  await updateGroupMemberById(membership._id, {
    invite: {
      status: "cancelled",
      statusChangedAt: new Date(),
    },
  });

  // Audit log
  recordAuditEvent({
    action: "user_left_group",
    userId,
    groupId,
    timestamp: new Date(),
  });
}
```

---

## Error Mapping

| Error Pattern          | HTTP Status | Message                              |
| ---------------------- | ----------- | ------------------------------------ |
| "not found"            | 404         | "Group not found"                    |
| "Already left"         | 409         | "You have already left this group"   |
| "not a member"         | 403         | "You are not a member of this group" |
| Authentication missing | 401         | "Authentication required"            |
| Validation error       | 400         | Field-specific error message         |

---

## Completeness Checklist

- ✅ All endpoints documented
- ✅ Request/response shapes defined
- ✅ Error cases mapped
- ✅ Status codes semantically correct
- ✅ Authentication requirements clear
- ✅ Side effects documented
- ✅ Implementation examples provided
