# Data Model: Convert Auth Forms

## Overview

This feature does not introduce new persistent collections. It aligns existing auth entities with frontend form-state entities and interaction transitions required for login, sign-up, and reset-password conversion.

## Persistent Domain Entities

### 1) User Account

- Purpose: Authenticated identity used by login and sign-up.
- Existing source: `express/src/models/users.ts`
- Key fields (contract-level):
  - id
  - email
  - firstName
  - lastName
  - passwordHash (server-managed)
  - passwordChangedAt (server-managed)
- Validation rules:
  - Email must be syntactically valid.
  - Password must meet backend validator rules.
  - Name fields must pass backend name validation.
- Relationships:
  - One user can have many authentication sessions.
  - One user can have many auth attempts.
  - One user can have many password reset requests over time.

### 2) Authentication Session

- Purpose: Represents active signed-in state.
- Existing source: `express/src/models/sessions.ts` and express-session store.
- Key fields (contract-level):
  - session id
  - userId
  - expiresAt
- Validation rules:
  - Session must contain a valid user reference for `/auth/me`.
- Relationships:
  - Belongs to one user account.

### 3) Password Reset Request

- Purpose: Time-bound reset credential used by reset-password confirm.
- Existing source: `express/src/models/passwordResets.ts`
- Key fields (contract-level):
  - userId
  - codeHash
  - expiresAt
  - usedAt
- Validation rules:
  - Reset code must be valid and unexpired.
  - Request is invalid after `usedAt` is set.
- Relationships:
  - Belongs to one user account.

### 4) Authentication Attempt

- Purpose: Rate-limit and security tracking for auth actions.
- Existing source: `express/src/models/authAttempts.ts`
- Key fields (contract-level):
  - identifier (email)
  - ipAddress
  - action type (signup/login/reset)
  - attempt counters/time window
- Validation rules:
  - Attempts enforce max threshold before allowing auth operation.
- Relationships:
  - Associated with a user identifier + IP context, optionally linked to user account after resolution.

## Frontend Interaction Entities

### 5) Login Form State

- Purpose: UI state for login page submission and feedback.
- Key fields:
  - email
  - password
  - touched map
  - fieldErrors map
  - formError
  - isSubmitting
- Validation rules:
  - Email required and formatted.
  - Password required.

### 6) Sign-Up Form State

- Purpose: UI state for account creation workflow.
- Key fields:
  - firstName
  - lastName
  - email
  - password
  - touched map
  - fieldErrors map
  - formError
  - isSubmitting
- Validation rules:
  - First/last name required.
  - Email required and formatted.
  - Password length and character-composition constraints.

### 7) Reset Password Form State

- Purpose: UI state for request + confirm flow.
- Request step fields:
  - email
  - touched/fieldErrors/formError/isSubmitting/isSuccess
- Confirm step fields:
  - email
  - code
  - password
  - touched/fieldErrors/formError/isSubmitting
  - emailFieldReadonly

## State Transitions

### Login

1. Idle -> Editing
2. Editing -> Submitting
3. Submitting -> Authenticated (success)
4. Submitting -> ErrorDisplayed (invalid, throttled, or server error)

### Sign-Up

1. Idle -> Editing
2. Editing -> Submitting
3. Submitting -> Authenticated (success)
4. Submitting -> ErrorDisplayed (validation conflict/throttle/server error)

### Reset Password

1. RequestIdle -> RequestSubmitting
2. RequestSubmitting -> ConfirmStep (request success)
3. ConfirmStep -> ConfirmSubmitting
4. ConfirmSubmitting -> Done (password updated)
5. Any submitting state -> ErrorDisplayed (invalid code, throttle, server error)

## UI Control Consistency Constraints

- Equivalent-size input and button controls must render at matching heights.
- All form controls expose visible focus, disabled, loading, and error states.
- Form error placement and validation timing must remain consistent across all three pages.
