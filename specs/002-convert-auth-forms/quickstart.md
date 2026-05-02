# Quickstart: Convert Auth Forms

## Goal

Implement and verify the conversion of login, sign-up, and reset-password forms to shared ShadCN primitives with larger, consistent control sizing while preserving existing auth endpoint behavior.

## Prerequisites

- Use branch `002-convert-auth-forms`.
- Install dependencies in both projects if needed.
- Ensure backend and frontend can run locally.

## Implementation Steps

1. Confirm existing route and API mappings

- Verify frontend auth API methods in `web/src/api/auth.ts` match backend auth routes in `express/src/routers/authRouter.ts`.
- Confirm request/response fields used by hooks align with service contracts.

2. Convert auth form presentation to shared ShadCN primitives

- Update:
  - `web/src/components/forms/LoginForm.tsx`
  - `web/src/components/forms/SignUpForm.tsx`
  - `web/src/components/forms/ResetPasswordForm.tsx`
  - `web/src/components/forms/ResetPasswordConfirmForm.tsx`
- Use existing design-system form primitives and preserve typed prop interfaces.

3. Standardize large control sizing

- Define/choose a shared size pattern for auth controls.
- Apply equal size variants so same-tier inputs and buttons have matching heights.
- Ensure consistent vertical rhythm and spacing across all auth forms.

4. Preserve hook/component boundaries

- Keep validation/mutation logic in hooks:
  - `web/src/hooks/useLoginForm.ts`
  - `web/src/hooks/useSignUpForm.ts`
  - `web/src/hooks/useResetPasswordForm.ts`
  - `web/src/hooks/useResetPasswordConfirmForm.ts`
- Keep form components presentational only.

5. Verify visual and interaction states

- Confirm visible focus rings, error styling, disabled state, and loading state on each page.
- Confirm mobile and desktop usability in the existing auth layout.

## Validation Checklist

### Static checks

- `cd web && npm run lint`
- `cd web && npm run build`
- `cd express && npm run build`

### Runtime checks

1. Login

- Valid credentials -> authenticated redirect.
- Invalid credentials -> clear message.
- Repeated failed attempts -> throttle message when applicable.

2. Sign-up

- Valid input -> account created and expected follow-up flow.
- Existing email -> conflict message.
- Invalid form fields -> field-level validation + submission blocked.

3. Reset password

- Request with email -> transitions to confirm step.
- Confirm with valid code/password -> success state.
- Invalid/expired code -> error message.

### UX consistency checks

- Inputs and primary buttons align in height for same size tier.
- Control padding is visibly larger than baseline.
- Error message placement and style are consistent across all three pages.
