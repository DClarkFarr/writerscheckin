# Data Model: User Profile Settings

**Date**: May 14, 2026  
**Feature**: User Profile Settings Page

## Entities

### User (Existing MongoDB Collection)

The `User` entity already exists. This feature updates two existing fields and adds tracking:

```typescript
interface UserDefinition extends BaseModelBlueprint {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  passwordChangedAt: Date; // Already exists; updated during password change
}
```

**Fields Modified by This Feature**:

- `firstName` — updated when user submits name form
- `lastName` — updated when user submits name form
- `passwordHash` — updated when user changes password
- `passwordChangedAt` — touched when password is changed (existing field)

**Fields NOT Modified**:

- `email` — displayed read-only; never modified by this feature

### UserProfileUpdateInput (Request Payload)

Sent to `PATCH /user/profile` endpoint:

```typescript
interface UserProfileUpdateInput {
  firstName?: string; // Optional; if provided, validated and updated
  lastName?: string; // Optional; if provided, validated and updated
  email?: never; // MUST NOT be included; backend rejects if present
}
```

**Validation Rules**:

- `firstName` and `lastName` MUST each be 1–255 characters
- Both fields are optional in a single request
- Email presence in request triggers `ValidationError("email", "Email updates are not permitted")`
- Whitespace-only strings are rejected

**Response**: Updated user object with new `firstName`, `lastName`, `updatedAt`, and original `email` (read-only confirmation).

---

### PasswordChangeInput (Request Payload)

Sent to `PUT /user/password` endpoint:

```typescript
interface PasswordChangeInput {
  currentPassword: string; // User's current plaintext password; verified against passwordHash
  newPassword: string; // New plaintext password; must match newPasswordConfirm and pass validation
  newPasswordConfirm: string; // Confirmation; must equal newPassword
  email?: never; // MUST NOT be included; backend rejects if present
}
```

**Validation Rules**:

- All three fields REQUIRED
- `currentPassword` must match stored `passwordHash` when verified (via bcryptjs)
- `newPassword` must pass existing password rules:
  - Minimum 8 characters
  - Must include uppercase, lowercase, number, and special character
  - Cannot be the same as currentPassword (after hashing)
- `newPasswordConfirm` must equal `newPassword` (case-sensitive)
- Email presence in request triggers `ValidationError("email", "Email updates are not permitted")`

**Response**: Success message confirming password changed. User must re-authenticate with new password on next login.

---

## State Transitions

### Profile Update Flow

```
User views settings page
  ↓
User enters name(s) and clicks "Save Name"
  ↓
Frontend validates locally (not blank, 255 char limit)
  ↓
Frontend submits PATCH /user/profile
  ↓
Backend validates inputs (no email, field lengths, etc.)
  ↓
Backend updates MongoDB User document
  ↓
Backend logs audit event (for name: no logging)
  ↓
Frontend receives updated user data
  ↓
Frontend displays success message and updates form
  ↓
Updated name persists on page refresh
```

### Password Change Flow

```
User views settings page
  ↓
User enters current password, new password, confirmation
  ↓
Frontend validates locally (required fields, new ≠ confirm mismatch)
  ↓
Frontend submits PUT /user/password
  ↓
Backend validates inputs (no email, field presence, lengths, etc.)
  ↓
Backend verifies currentPassword against passwordHash (bcryptjs)
  ↓
Backend validates newPassword (min 8 chars, complexity rules)
  ↓
Backend hashes newPassword (bcryptjs, 12 rounds)
  ↓
Backend updates MongoDB User document with new passwordHash and passwordChangedAt
  ↓
Backend logs audit event for password change
  ↓
Backend clears all user's active sessions (user must re-login)
  ↓
Frontend receives success message
  ↓
Frontend redirects user to login or shows logout message
  ↓
User logs in with new password
```

---

## Validation Rules

### Name Fields

| Field       | Min Length | Max Length | Allowed Characters | Required |
| ----------- | ---------- | ---------- | ------------------ | -------- |
| `firstName` | 1          | 255        | Any printable text | No\*     |
| `lastName`  | 1          | 255        | Any printable text | No\*     |

\*Optional per request, but if provided must meet requirements. At least one field should be provided per request to be meaningful.

### Password Change

| Aspect                  | Requirement                                                    |
| ----------------------- | -------------------------------------------------------------- |
| Current password        | MUST match stored hash (verified via bcryptjs)                 |
| New password length     | MUST be 8–128 characters                                       |
| New password complexity | MUST include uppercase, lowercase, digit, special character    |
| Confirmation match      | MUST equal new password exactly (case-sensitive)               |
| Reuse prevention        | New password MUST NOT hash to same value as current (no reuse) |

---

## Audit Logging

### Password Change Event

```typescript
recordAuditEvent({
  action: "password_changed",
  userId: user._id.toString(),
  email: user.email,
  ipAddress: req.ip || "unknown",
});
```

**Logged For**: Password change only
**Not Logged**: Name updates (not security-sensitive)

---

## API Endpoints (Contracts)

See [contracts/update-user-profile-contract.md](contracts/update-user-profile-contract.md) and [contracts/change-password-contract.md](contracts/change-password-contract.md) for endpoint specifications.
