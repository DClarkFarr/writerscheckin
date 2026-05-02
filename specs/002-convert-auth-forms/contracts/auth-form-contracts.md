# Auth Form Contracts

## Scope

Contracts for the three converted auth pages:

- Login
- Sign-Up
- Reset Password (request and confirm steps)

This feature preserves existing backend auth routes and payload contracts while standardizing frontend form composition and control sizing.

## HTTP Interface Contracts

### 1) Sign-Up

- Method: `POST`
- Path: `/auth/signup`
- Request body:
  - `firstName: string`
  - `lastName: string`
  - `email: string`
  - `password: string`
- Success:
  - Status: `201`
  - Body: `{ user: { id, email, firstName, lastName } }`
- Error classes used by frontend mapping:
  - `400` validation failure
  - `409` duplicate account
  - `429` throttled
  - `5xx` unknown server errors

### 2) Login

- Method: `POST`
- Path: `/auth/login`
- Request body:
  - `email: string`
  - `password: string`
- Success:
  - Status: `200`
  - Body: `{ user: { id, email, firstName, lastName } }`
- Error classes used by frontend mapping:
  - `401` invalid credentials
  - `429` throttled
  - `5xx` unknown server errors

### 3) Reset Password Request

- Method: `POST`
- Path: `/auth/reset-password/request`
- Request body:
  - `email: string`
- Success:
  - Status: `200`
  - Body: `{ message: string }`
- Error classes used by frontend mapping:
  - `429` throttled
  - `5xx` unknown server errors

### 4) Reset Password Confirm

- Method: `POST`
- Path: `/auth/reset-password/confirm`
- Request body:
  - `email: string`
  - `code: string` (6 digits)
  - `password: string`
- Success:
  - Status: `200`
  - Body: `{ message: "Password updated" }`
- Error classes used by frontend mapping:
  - `401` invalid or expired reset code
  - `429` throttled
  - `5xx` unknown server errors

### 5) Current User

- Method: `GET`
- Path: `/auth/me`
- Success:
  - Status: `200`
  - Body: `{ user: { id, email, firstName, lastName } }`

## Frontend Component Contracts

### Shared Form Behavior Contract

All three target pages MUST adhere to this interaction contract:

- Presentational form components receive typed props from hooks.
- Components do not call API functions directly.
- Hooks own validation, submission, loading state, and API error mapping.
- Field-level errors are shown after blur/touch or after a submit attempt.
- Submission disables primary action and exposes loading affordance.

### Shared Control Sizing Contract

- Auth form inputs and primary buttons must use standardized size variants.
- Controls with the same size variant must have matched rendered heights.
- Control spacing/padding must be increased relative to current baseline.

### State Visibility Contract

Each form MUST visually communicate:

- Default
- Focused
- Invalid
- Disabled
- Submitting/loading
- Form-level error

## Non-Goals

- No auth endpoint path changes.
- No backend data model redesign.
- No changes to non-auth pages.
