# Implementation Plan: Convert Auth Forms

**Branch**: `002-convert-auth-forms` | **Date**: 2026-05-01 | **Spec**: `/specs/002-convert-auth-forms/spec.md`
**Input**: Feature specification from `/specs/002-convert-auth-forms/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Convert the login, sign-up, and reset-password pages to shared ShadCN form primitives while
preserving existing authentication behavior and endpoint contracts. The implementation keeps the
existing hook-based form logic and API modules, replaces legacy form controls with a consistent
Field/Input/Button composition, and introduces shared size tokens/classes so input and button
heights remain aligned for equivalent sizes across all auth forms.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend + backend), React 19 SPA, Express 5 API  
**Primary Dependencies**: TanStack Router, TanStack Query, Axios, Tailwind CSS v4, ShadCN UI primitives, express-session, MongoDB models/services  
**Storage**: MongoDB (existing users/sessions/password resets/auth attempts collections), session cookies via express-session  
**Testing**: `npm run lint` + `npm run build` in `web/`, `npm run build` in `express/`, manual auth flow verification matrix in this feature quickstart  
**Target Platform**: Modern mobile/desktop browsers for SPA; Node.js server runtime for API  
**Project Type**: Monorepo web application (`web/` frontend + `express/` backend)  
**Performance Goals**: No measurable regression in auth submission latency or interaction responsiveness; preserve current backend auth throughput behavior  
**Constraints**: Must preserve existing auth routes and service/model behavior; must use shared design-system primitives; must maintain visible validation/error/loading states; must remain mobile-first responsive  
**Scale/Scope**: Three auth pages (`login`, `sign-up`, `reset-password`) plus associated form components/hooks/API mapping and sizing consistency

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Work is limited to existing TypeScript and class usage patterns.
- **II. Layered Backend Architecture**: PASS. No backend architecture changes are planned; route/service/model boundaries remain intact.
- **VI. Frontend Hook + Component Separation for Forms**: PASS. Existing hook-driven logic remains the source of state/mutation handling; form components remain presentational.
- **VIII. API Client & Data Fetching**: PASS. Existing `web/src/api/auth.ts` Axios + typed error mapping remains the integration layer.
- **XI. Product Design Imperatives**: PASS with implementation checks. Auth layout/form controls will be standardized with larger touch targets while preserving mobile-first behavior.
- **XII. ShadCN UI Component System**: PASS. Plan uses existing ShadCN primitives/composition and avoids modifying baseline UI primitives unless explicitly required.

### Post-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Artifacts specify typed props/contracts and no type-system bypasses.
- **II. Layered Backend Architecture**: PASS. Contracts preserve current backend route/service responsibilities.
- **VI. Frontend Hook + Component Separation for Forms**: PASS. Data model and quickstart keep hook/component split as a hard requirement.
- **VIII. API Client & Data Fetching**: PASS. Contracts keep all frontend auth calls in `web/src/api/auth.ts` using existing request/response semantics.
- **XI. Product Design Imperatives**: PASS pending implementation verification from quickstart checks for sizing, contrast, and state clarity.
- **XII. ShadCN UI Component System**: PASS. Design phase documents composition-first approach and immutable baseline primitive rule.

## Project Structure

### Documentation (this feature)

```text
specs/002-convert-auth-forms/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-form-contracts.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── routers/
    │   ├── apiRouter.ts
    │   └── authRouter.ts
    ├── services/
    │   └── authService.ts
    └── models/
        ├── users.ts
        ├── sessions.ts
        ├── passwordResets.ts
        └── authAttempts.ts

web/
└── src/
    ├── api/
    │   └── auth.ts
    ├── components/
    │   ├── forms/
    │   │   ├── LoginForm.tsx
    │   │   ├── SignUpForm.tsx
    │   │   ├── ResetPasswordForm.tsx
    │   │   └── ResetPasswordConfirmForm.tsx
    │   └── ui/
    ├── hooks/
    │   ├── useLoginForm.ts
    │   ├── useSignUpForm.ts
    │   ├── useResetPasswordForm.ts
    │   └── useResetPasswordConfirmForm.ts
    ├── pages/
    │   ├── login.tsx
    │   ├── sign-up.tsx
    │   └── reset-password.tsx
    └── routes/
        ├── _auth.tsx
        └── _auth/
```

**Structure Decision**: Use the existing monorepo split. Backend auth contracts remain in
`express/src/routers/authRouter.ts` and `express/src/services/authService.ts`. UI conversion work
is fully concentrated in `web/src/components/forms/` with no architectural movement of hooks/API
modules, preserving the established `hooks` -> `components/forms` -> `pages` route composition.

## Complexity Tracking

No constitution violations requiring exemptions are expected for this feature.
