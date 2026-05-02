# Research: Convert Auth Forms

## Decision 1: Preserve Existing Auth Endpoint Contracts

- Decision: Keep current auth endpoint paths and request/response payload shapes unchanged for login, sign-up, reset request, and reset confirm flows.
- Rationale: Frontend hooks and backend services are already contract-aligned (`/auth/signup`, `/auth/login`, `/auth/reset-password/request`, `/auth/reset-password/confirm`, `/auth/me`), and the feature intent is UI/form modernization rather than API redesign.
- Alternatives considered: Introduce new versioned auth endpoints for form migration; rejected because it adds avoidable backend risk and duplicate logic.

## Decision 2: Keep Hook-Driven Form Logic and Convert Only Presentational Form Layer

- Decision: Retain `useLoginForm`, `useSignUpForm`, `useResetPasswordForm`, and `useResetPasswordConfirmForm` as the sole owners of state, validation, mutation, and API error mapping; update form components to use shared ShadCN primitives.
- Rationale: This matches constitution Principle VI and minimizes regression risk by not moving business logic while improving UI consistency.
- Alternatives considered: Move validation/mutation logic directly into components; rejected due to architecture violation and reduced testability.

## Decision 3: Standardize Control Sizing Through Shared Variants/Classes

- Decision: Define and apply a consistent large-control pattern across auth forms so text inputs and submit buttons share equivalent heights for the same size tier.
- Rationale: The feature explicitly requires larger controls, added padding, and matched control heights; consistency is best enforced through shared design-system sizing patterns.
- Alternatives considered: Per-form ad hoc class overrides; rejected because it causes drift and inconsistent interaction targets.

## Decision 4: Validate End-to-End Behavior with Contract + UX Matrix

- Decision: Verify each page against a matrix that covers success, validation failure, rate limit, and unavailable-service behavior while checking visual states (focus, error, disabled, loading).
- Rationale: Requirements combine integration correctness and visual consistency; both must be validated together.
- Alternatives considered: Only run static checks (`lint`/`build`) without flow validation; rejected because route wiring and runtime feedback issues would be missed.

## Decision 5: Treat "Recent Password" as Existing Reset Password Flow

- Decision: Scope the third requested page to the current `reset-password` flow (`request -> confirm -> done`) already present in the SPA.
- Rationale: Existing pages and hooks implement this flow directly and the originating feature spec already clarified this interpretation.
- Alternatives considered: Introduce a separate "recent password" route/feature; rejected as ambiguous and outside user-requested conversion scope.
