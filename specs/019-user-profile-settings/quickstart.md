# Quickstart: User Profile Settings Implementation

**Date**: May 14, 2026  
**Feature**: User Profile Settings  
**Scope**: Backend endpoints + frontend settings page

## Implementation Order

### Phase 1: Backend Endpoints (Express/TypeScript)

1. **Create `express/src/services/userProfileService.ts`**
   - `updateUserProfile(userId, firstName?, lastName?, ipAddress)` → validates inputs, updates User
   - `changePassword(userId, currentPassword, newPassword, ipAddress)` → verifies current, validates new, updates hash, logs audit
   - Error handling: `ValidationError` for invalid inputs, `AuthError` for wrong current password

2. **Update `express/src/models/users.ts`**
   - Add `updateUserById(userId, { firstName?, lastName?, passwordHash?, passwordChangedAt? })` function
   - Already exists; just verify it accepts partial updates
   - No schema changes needed; all fields already exist

3. **Create `express/src/routers/userRouter.ts`**
   - `PATCH /profile` → extracts session userId, calls `updateUserProfile()`
   - `PUT /password` → extracts session userId, calls `changePassword()`
   - Both routers reject email in request body with `ValidationError`
   - Follow existing pattern: `getAuthenticatedUserId(req)` to extract userId from session

4. **Register router in `express/src/routers/apiRouter.ts`**
   - Import `userRouter` and call `applyNestedRouter(apiRouter, "/user", userRouter)`

5. **Build & Test Express**
   - `cd express && npm run build` → verify TypeScript compilation
   - Manual testing with curl against both endpoints

### Phase 2: Frontend Settings Page (React/TypeScript)

1. **Create `web/src/api/users.ts`**
   - `updateProfile(firstName?, lastName?)` → calls `PATCH /api/user/profile` via `apiClient`
   - `changePassword(currentPassword, newPassword, newPasswordConfirm)` → calls `PUT /api/user/password` via `apiClient`
   - Error handling: `mapApiError()` to convert status/response to user-friendly messages

2. **Create `web/src/hooks/useUpdateProfileForm.ts`**
   - State: `{ firstName, lastName, firstNameTouched, lastNameTouched, isSubmitting, formError }`
   - Mutation: `useMutation` for `updateProfile()` with error mapping
   - Validation: `validateField(name, value)` checks length and blank
   - Returns typed `UpdateProfileFormProps` interface
   - No JSX

3. **Create `web/src/hooks/useChangePasswordForm.ts`**
   - State: `{ currentPassword, newPassword, newPasswordConfirm, ...touched, isSubmitting, formError }`
   - Mutation: `useMutation` for `changePassword()` with error mapping
   - Validation: `validateField()` checks length, complexity, match
   - Returns typed `ChangePasswordFormProps` interface
   - No JSX

4. **Create `web/src/components/user/ProfileSettingsForm.tsx`**
   - Receives `UpdateProfileFormProps` from hook
   - Renders name form with two fields, Save button
   - Shows field errors if touched or after submit
   - Shows form-level success message after successful submit

5. **Create `web/src/components/user/ChangePasswordForm.tsx`**
   - Receives `ChangePasswordFormProps` from hook
   - Renders password form with three fields, Change button
   - Shows field errors if touched or after submit
   - Shows form-level success message or redirect prompt

6. **Create `web/src/components/user/UserSettingsPage.tsx`**
   - Displays read-only email field: `<input type="email" value={email} disabled />`
   - Wires hooks and components:
     ```tsx
     const profileProps = useUpdateProfileForm({ onSuccess: ... });
     const passwordProps = useChangePasswordForm({ onSuccess: ... });
     return (
       <>
         <EmailDisplay email={currentUser.email} />
         <ProfileSettingsForm {...profileProps} />
         <ChangePasswordForm {...passwordProps} />
       </>
     );
     ```
   - Fetches current user email from existing auth store

7. **Create `web/src/routes/user/settings.tsx`**
   - Route file: `/user/settings`
   - Component: import and render `UserSettingsPage`
   - File-based routing following TanStack Router convention

8. **Update `web/src/components/layout/UserMenu.tsx`** (or existing user dropdown)
   - Add link to `/user/settings` with text "Settings" or "Profile Settings"
   - Link should only display when user is authenticated
   - Place after existing menu items (e.g., logout)

9. **TypeScript Compilation**
   - `cd web && npx tsc --noEmit` → verify no type errors

---

## Implementation Checklist

### Backend Implementation Validation

- [ ] `userProfileService.ts` exists with both functions implemented
- [ ] `updateUserProfile()` rejects email in input with ValidationError
- [ ] `updateUserProfile()` validates name field lengths (1–255, non-blank)
- [ ] `changePassword()` verifies current password against passwordHash
- [ ] `changePassword()` validates new password (8+ chars, complexity rules, not same as current)
- [ ] `changePassword()` calls `endSessionsByUserId()` to invalidate all sessions
- [ ] `changePassword()` calls `recordAuditEvent()` with action "password_changed"
- [ ] `userRouter.ts` exists with PATCH /profile and PUT /password
- [ ] Both endpoints extract userId from session (not from request path/body)
- [ ] Both endpoints reject email in request body
- [ ] `apiRouter.ts` registers userRouter at `/user`
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Curl test: `PATCH /api/user/profile` updates name successfully
- [ ] Curl test: `PUT /api/user/password` with correct current password succeeds
- [ ] Curl test: `PUT /api/user/password` with wrong current password returns 401
- [ ] Curl test: Both endpoints reject requests with `email` field in body

### Frontend Implementation Validation

- [ ] `web/src/api/users.ts` exports `updateProfile()` and `changePassword()`
- [ ] `useUpdateProfileForm.ts` hook exists with proper state management
- [ ] `useChangePasswordForm.ts` hook exists with proper state management
- [ ] Client-side validation prevents submit for invalid inputs (before API call)
- [ ] `ProfileSettingsForm.tsx` renders email field with `disabled` attribute
- [ ] `ProfileSettingsForm.tsx` renders name fields with error display
- [ ] `ChangePasswordForm.tsx` renders three password fields with error display
- [ ] `UserSettingsPage.tsx` wires both forms and displays current user email
- [ ] `/user/settings` route exists and renders `UserSettingsPage`
- [ ] User menu includes link to `/user/settings` (visible when authenticated)
- [ ] `npx tsc --noEmit` succeeds with no TypeScript errors
- [ ] Manual test: Update name and verify it persists on page refresh
- [ ] Manual test: Change password and verify old password no longer works
- [ ] Manual test: Change password and verify new password works after logout/login
- [ ] Manual test: Attempt to edit email field → field disabled, no response from backend
- [ ] Manual test: Form validation shows errors before submission

---

## Quick Validation Commands

### Backend

```bash
# Compile TypeScript
cd /Users/daniel/git/writerscheck.in/express
npm run build

# Test update profile endpoint
curl -X PATCH http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -b "wci.sid=[YOUR_SESSION_ID]" \
  -d '{"firstName": "Test"}'

# Test password change endpoint
curl -X PUT http://localhost:3000/api/user/password \
  -H "Content-Type: application/json" \
  -b "wci.sid=[YOUR_SESSION_ID]" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass456@",
    "newPasswordConfirm": "NewPass456@"
  }'

# Test email rejection
curl -X PATCH http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -b "wci.sid=[YOUR_SESSION_ID]" \
  -d '{"email": "test@example.com"}'
```

### Frontend

```bash
# Compile TypeScript
cd /Users/daniel/git/writerscheck.in/web
npx tsc --noEmit

# Navigate to settings page
# Open browser at http://localhost:5173/user/settings (or dev server URL)
```

---

## Data Flow Diagrams

### Name Update Flow

```
User enters firstName/lastName
  ↓
User clicks "Save Name"
  ↓
useUpdateProfileForm validates locally
  ↓
If valid, calls updateProfile() mutation
  ↓
Frontend sends PATCH /api/user/profile
  ↓
userProfileService.updateUserProfile() validates server-side
  ↓
MongoDB updates User document
  ↓
Response returns updated user
  ↓
Hook updates local state, triggers onSuccess callback
  ↓
Form displays success message
  ↓
User refreshes page → new name persists
```

### Password Change Flow

```
User enters currentPassword, newPassword, newPasswordConfirm
  ↓
User clicks "Change Password"
  ↓
useChangePasswordForm validates locally
  ↓
If valid, calls changePassword() mutation
  ↓
Frontend sends PUT /api/user/password
  ↓
userProfileService.changePassword():
  - Verifies currentPassword via bcryptjs
  - Validates newPassword (8+ chars, complexity)
  - Checks newPassword ≠ currentPassword
  - Hashes newPassword
  ↓
MongoDB updates User.passwordHash and User.passwordChangedAt
  ↓
endSessionsByUserId() invalidates all user sessions
  ↓
recordAuditEvent() logs password_changed action
  ↓
Response returns success message
  ↓
Hook updates local state, triggers onSuccess callback
  ↓
Form displays success message + redirect prompt
  ↓
User logs out and re-authenticates with new password
```

---

## Next Steps After Implementation

1. **Manual QA**: Test all acceptance scenarios from spec.md
2. **Security Review**: Verify password hashing, session invalidation, email protection
3. **Integration Testing**: Test with real MongoDB and email audit logging
4. **Browser Testing**: Test on mobile viewport; verify email field stays disabled
5. **Deploy**: Merge to main and deploy via `deploy.sh` script
