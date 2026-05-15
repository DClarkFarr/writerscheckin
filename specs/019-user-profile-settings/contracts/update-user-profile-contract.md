# Contract: Update User Profile

**Endpoint**: `PATCH /api/user/profile`  
**Authentication**: Session-based (user must be logged in)  
**Authorization**: User can only update their own profile (enforced via session userId)

## Request

### Headers

```
Content-Type: application/json
Cookie: wci.sid=[session_id]
```

### Body

```typescript
{
  firstName?: string;    // Optional; if provided, must be 1–255 non-blank characters
  lastName?: string;     // Optional; if provided, must be 1–255 non-blank characters
  // Email MUST NOT be included; presence triggers validation error
}
```

### Valid Examples

```json
{
  "firstName": "Alice"
}
```

```json
{
  "lastName": "Smith"
}
```

```json
{
  "firstName": "Alice",
  "lastName": "Smith"
}
```

### Invalid Examples

```json
{
  "email": "newemail@example.com"
}
```

→ Rejected with 400 ValidationError

```json
{
  "firstName": ""
}
```

→ Rejected with 400 ValidationError (blank not allowed)

```json
{
  "firstName": "a".repeat(256)
}
```

→ Rejected with 400 ValidationError (exceeds 255 characters)

---

## Response

### Success (200 OK)

```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice@example.com",
    "passwordChangedAt": "2026-03-15T10:00:00Z",
    "createdAt": "2026-01-10T09:00:00Z",
    "updatedAt": "2026-05-14T14:30:00Z"
  }
}
```

Returns the updated user object (with all fields, read-only). Frontend should update local state and display success message.

### Error: Invalid Input (400 Bad Request)

```json
{
  "error": "firstName must be between 1 and 255 characters"
}
```

```json
{
  "error": "Email updates are not permitted"
}
```

```json
{
  "error": "firstName must not be blank"
}
```

### Error: Unauthorized (401 Unauthorized)

```json
{
  "error": "Not authenticated"
}
```

User session is missing or expired. Redirect to login.

---

## Implementation Notes

1. **Validation Order**:
   - Check email presence → reject immediately if found
   - Check firstName/lastName lengths and blank state
   - If any validation fails, return 400 with specific field error

2. **Database Update**:
   - Call `updateUserById(userId, { firstName, lastName })` from `users.ts` model
   - MongoDB automatically sets `updatedAt` via timestamp middleware

3. **No Side Effects**:
   - Name updates do NOT trigger audit logging
   - No session invalidation
   - No email notification sent

4. **Idempotency**:
   - Submitting the same data twice yields identical response (safe to retry)

---

## Curl Example

```bash
curl -X PATCH http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -b "wci.sid=abc123xyz" \
  -d '{
    "firstName": "Alice",
    "lastName": "Smith"
  }'
```
