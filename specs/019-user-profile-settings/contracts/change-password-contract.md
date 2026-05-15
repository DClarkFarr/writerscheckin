# Contract: Change Password

**Endpoint**: `PUT /api/user/password`  
**Authentication**: Session-based (user must be logged in)  
**Authorization**: User can only change their own password (enforced via session userId)

## Request

### Headers

```
Content-Type: application/json
Cookie: wci.sid=[session_id]
```

### Body

```typescript
{
  currentPassword: string; // REQUIRED; user's current password (plaintext, verified against passwordHash)
  newPassword: string; // REQUIRED; new password (plaintext; must be hashed before storage)
  newPasswordConfirm: string; // REQUIRED; confirmation of new password (must match newPassword)
  // Email MUST NOT be included; presence triggers validation error
}
```

### Validation Rules (Client-Side Hints)

- All three fields are REQUIRED
- `currentPassword` and `newPassword` must each be 8–128 characters
- `newPassword` must include:
  - At least one uppercase letter (A–Z)
  - At least one lowercase letter (a–z)
  - At least one digit (0–9)
  - At least one special character (!@#$%^&\*)
- `newPasswordConfirm` must equal `newPassword` exactly (case-sensitive)

### Valid Example

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456@",
  "newPasswordConfirm": "NewPass456@"
}
```

### Invalid Examples

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456@",
  "newPasswordConfirm": "newpass456@",
  "email": "newemail@example.com"
}
```

→ Rejected with 400 ValidationError (email not permitted)

```json
{
  "currentPassword": "WrongPass123!",
  "newPassword": "NewPass456@",
  "newPasswordConfirm": "NewPass456@"
}
```

→ Rejected with 401 AuthError (current password incorrect)

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "weak",
  "newPasswordConfirm": "weak"
}
```

→ Rejected with 400 ValidationError (password too short and missing complexity)

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456@",
  "newPasswordConfirm": "DifferentPass456@"
}
```

→ Rejected with 400 ValidationError (passwords do not match)

---

## Response

### Success (200 OK)

```json
{
  "message": "Password updated successfully. You will need to log in again with your new password."
}
```

No user data returned. Frontend should display message and redirect user to logout/login flow.

**Important**: Password change does NOT automatically log out user, but they should be directed to log in again with new credentials. Session remains valid until next navigation/refresh to allow smooth UX flow.

### Error: Current Password Incorrect (401 Unauthorized)

```json
{
  "error": "Current password is incorrect"
}
```

Prompt user to re-enter current password.

### Error: Validation Failure (400 Bad Request)

```json
{
  "error": "New password must be at least 8 characters"
}
```

```json
{
  "error": "New password must include uppercase, lowercase, digit, and special character"
}
```

```json
{
  "error": "New password and confirmation do not match"
}
```

```json
{
  "error": "Email updates are not permitted"
}
```

```json
{
  "error": "New password must be different from your current password"
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
   - Check all three fields are present → reject if missing
   - Client-side validation hints (length, complexity, match)
   - Backend password verification
   - Backend new password validation

2. **Password Verification**:
   - Call `verifyPassword(currentPassword, user.passwordHash)` from `utils/passwords.ts`
   - Throws `AuthError` if mismatch (timing-safe comparison via bcryptjs)

3. **Password Hashing**:
   - Call `hashPassword(newPassword)` from `utils/passwords.ts` (12 salt rounds)
   - Store new hash in `User.passwordHash`

4. **Database Update**:
   - Call `updateUserById(userId, { passwordHash, passwordChangedAt: new Date() })` from `users.ts` model

5. **Session Invalidation**:
   - Call `endSessionsByUserId(userId)` from `sessions.ts` model
   - All active sessions for user are terminated
   - User forced to re-authenticate with new password

6. **Audit Logging**:
   - Call `recordAuditEvent({ action: "password_changed", userId, email, ipAddress })`
   - Logged AFTER successful password update

7. **Idempotency**:
   - Password change is NOT idempotent (intentionally — password updated each time)
   - Retries will fail if password was already changed (old password won't match)

---

## Curl Example

```bash
curl -X PUT http://localhost:3000/api/user/password \
  -H "Content-Type: application/json" \
  -b "wci.sid=abc123xyz" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass456@",
    "newPasswordConfirm": "NewPass456@"
  }'
```
