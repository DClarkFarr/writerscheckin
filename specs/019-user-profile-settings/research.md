# Research: User Profile Settings

**Date**: May 14, 2026  
**Feature**: User Profile Settings Page  
**Research Phase**: Complete

## Decision 1: Existing Password Validation Rules

**Decision**: Reuse existing password validation from `authService.ts`

**Rationale**: The application already has password validation rules in the authentication service. Password change should enforce the same rules as signup/login for consistency.

**Alternatives Considered**:

- Create new validation rules specific to password change (rejected — would create duplicate validation logic)
- No password validation (rejected — would weaken security)

**Implementation**: Extract password validation helpers from `authService.ts` and call them in `userProfileService.ts` during password change validation.

---

## Decision 2: Password Hashing & Verification Flow

**Decision**: Use `verifyPassword()` from `utils/passwords.ts` for current password verification, then `hashPassword()` for new password hashing

**Rationale**: Existing utilities handle bcryptjs operations at 12 salt rounds, consistent with the rest of the application.

**Alternatives Considered**:

- Store plain text old password for comparison (rejected — major security issue)
- Use a different hashing strategy (rejected — breaks consistency)

**Implementation**: In `userProfileService.changePassword()`, call `verifyPassword()` against stored `passwordHash`, then `hashPassword()` for new password.

---

## Decision 3: Session User ID Extraction

**Decision**: Follow existing pattern with `getAuthenticatedUserId()` helper in router

**Rationale**: All authenticated endpoints in `groupsRouter.ts`, `membersRouter.ts`, etc. use this pattern. Consistent with constitution principle II.

**Alternatives Considered**:

- Extract from request path parameter (rejected — violates "no user ID in endpoint" requirement)
- Middleware-based injection (rejected — less explicit, harder to debug)

**Implementation**: Create `userRouter.ts` with `const getAuthenticatedUserId = (req) => getSession(req).userId` pattern.

---

## Decision 4: Email Field Display Strategy

**Decision**: Read-only HTML input with `disabled` attribute + backend endpoint doesn't accept email parameter

**Rationale**: Dual protection: UI prevents edit, backend prevents submission. Email changes are out of scope (separate workflow required).

**Alternatives Considered**:

- Hidden field (rejected — not user-visible for transparency)
- Removed from form entirely (rejected — spec requires display)
- Editable with backend rejection (rejected — poor UX, confusing error)

**Implementation**:

- Frontend: `<input type="email" value={email} disabled />` in `UserSettingsPage.tsx`
- Backend: Don't include email in update payloads; throw `ValidationError` if present in request body

---

## Decision 5: Error Messaging Strategy

**Decision**: Specific, user-friendly error messages mapped in client-side hook error handler

**Rationale**: Better UX than raw API errors; allows internationalization later.

**Alternatives Considered**:

- Generic "Update failed" message (rejected — doesn't guide user to fix problem)
- Raw backend error messages (rejected — may leak implementation details)

**Implementation**:

- `mapApiError()` function in hooks maps status codes/error patterns to user messages
- Examples: "Current password is incorrect", "Passwords do not match", "Password does not meet requirements"

---

## Decision 6: Audit Logging Scope

**Decision**: Log password change actions via `recordAuditEvent()` from `utils/audit.ts`

**Rationale**: Password changes are security-sensitive per Constitution Principle IV. Name changes are not logged.

**Alternatives Considered**:

- Log all profile updates (rejected — name changes are not security-relevant)
- No logging (rejected — violates audit trail requirement)

**Implementation**: Call `recordAuditEvent({ action: "password_changed", userId, email, ipAddress })` in `userProfileService.changePassword()` after successful update.

---

## Decision 7: Form Error State & Field-Level Validation Timing

**Decision**: Validate on field blur, show errors after blur or after submit attempt

**Rationale**: Matches existing form patterns in signup/login (following Principle VI). Reduces noise while typing.

**Alternatives Considered**:

- Validate on every keystroke (rejected — distracting, too much visual feedback)
- Validate only on submit (rejected — slower feedback cycle, worse UX)

**Implementation**:

- Custom hooks manage `touched` state per field via `onBlur` handler
- Errors display only if `touched` or `submitAttempted`
- Real-time validation runs but doesn't display until user leaves field

---

## Summary

All research decisions align with existing architecture patterns and security practices. No clarifications required; ready for Phase 1 design and contract generation.
