# Contract: Member Search API

**Version**: 1.0  
**Endpoint**: `GET /api/members/search`  
**Authentication**: Required (Bearer token)

## Request

### Query Parameters

| Parameter | Type   | Required | Description                                        |
| --------- | ------ | -------- | -------------------------------------------------- |
| q         | string | Yes      | Search query (name or email), minimum 2 characters |
| groupId   | string | No       | Group ID to exclude already-added members          |
| limit     | number | No       | Max results returned, default 10, max 50           |

### Examples

```
GET /api/members/search?q=john&limit=10
GET /api/members/search?q=john.doe@company.com&groupId=507f1f77bcf86cd799439011
```

## Response

### Success (200 OK)

```json
{
  "results": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Smith",
      "email": "john.smith@company.com",
      "avatar": "https://cdn.example.com/avatars/507f1f77bcf86cd799439011.jpg"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "avatar": "https://cdn.example.com/avatars/507f1f77bcf86cd799439012.jpg"
    }
  ],
  "inviteOption": {
    "email": "john.unknown@company.com",
    "suggested": true
  }
}
```

### No Matches, Valid Email

```json
{
  "results": [],
  "inviteOption": {
    "email": "newuser@company.com",
    "suggested": true
  }
}
```

### No Matches, Invalid Email

```json
{
  "results": [],
  "inviteOption": null
}
```

### Error (400 Bad Request)

```json
{
  "error": "Query must be at least 2 characters"
}
```

### Error (401 Unauthorized)

```json
{
  "error": "Authentication required"
}
```

## Implementation Notes

- Frontend MUST debounce queries with 250ms delay
- Backend MUST NOT query if q.length < 2
- Results sorted: exact email matches first, then partial name matches
- Duplicate emails filtered (invite option only shows if no exact match)
- Performance: Must respond in <500ms for typical user database (10k+ users)
- Caching: Results safe to cache 5-10 minutes on client

## Search Matching Rules

1. **Exact Email Match**: If query matches a user's email exactly → include with priority
2. **Partial Name Match**: If query matches first/last name as substring (case-insensitive) → include
3. **Order**: Exact matches first, then partial name matches, then suggest invite option
4. **Limit**: Max 10 results by default; configurable up to 50
5. **Already Added**: If groupId provided, exclude members already in group

### Examples

| Query                  | Matches                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| "john"                 | Users with "John" in first/last name; emails starting with "john" |
| "john.doe@company.com" | User with exact email; not partial matches                        |
| "smith"                | Users with "Smith" in name                                        |
| "jo"                   | Users with matching two-character partial names                   |
