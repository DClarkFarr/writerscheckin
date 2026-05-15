# Implementation Plan: User Profile Settings

**Branch**: `019-user-profile-settings` | **Date**: May 14, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/019-user-profile-settings/spec.md`

## Summary

Enable users to manage their account profile through a dedicated settings page accessible from the user menu. Provide separate forms for updating name and changing password, with a read-only email field. Backend endpoints authenticate via session and reject email modification attempts. No database schema changes required — updates modify existing `User.firstName`, `User.lastName`, and `User.passwordHash` fields.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, bcryptjs, React 19, TanStack Query v5, Axios API client, ShadCN UI, Tailwind CSS v4  
**Storage**: MongoDB (`users` collection — existing schema, no migrations)  
**Testing**: `cd express && npm run build`, `cd web && npx tsc --noEmit`, manual form submission validation  
**Target Platform**: Monorepo web app (Express API + React SPA)  
**Project Type**: Web application feature spanning backend endpoints and frontend UI  
**Performance Goals**: Name update and password change complete within 2 seconds; form validation displays client-side errors immediately  
**Constraints**: Layered backend architecture (models → services → routers); session-based authentication only; email field permanently disabled; backend endpoint rejects email modifications; no new collections or schema extensions  
**Scale/Scope**: One settings page, two update endpoints (name, password), email display only, no email modification workflow

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                                  |
| --------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | New API endpoints, service functions, React hooks, and components remain fully typed.                                  |
| II. Layered Backend Architecture              | PASS   | User data updates stay in models; service layer handles password hashing and validation; routers extract session only. |
| III. Centralized Error Handling               | PASS   | Form validation and API errors route through existing error handlers.                                                  |
| IV. Security-First Implementation             | PASS   | Password hashing via bcryptjs; session-based auth; password history via `passwordChangedAt`.                           |
| V. Environment Configuration                  | PASS   | No new environment variables required.                                                                                 |
| VI. Frontend Hook + Component Separation      | PASS   | Custom hooks own form state, validation, and mutations; components render typed props only.                            |
| VII. File-Based Routing (TanStack Router)     | PASS   | New route file in `web/src/routes/` follows existing file conventions.                                                 |
| VIII. API Client & Data Fetching              | PASS   | Frontend calls via `apiClient` in dedicated API module; TanStack Query handles mutations.                              |
| IX. Audit Logging                             | PASS   | Password change action logged via `recordAuditEvent()`.                                                                |
| XI. Product Design Imperatives                | PASS   | Settings page integrates into existing user menu; no product shell changes; clean, simple form layout.                 |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | All mutations through custom hooks; no direct component-level API calls.                                               |

**Post-Design Re-Check**: PASS. Planned artifacts preserve layering, strict typing, session-auth-only endpoints, email protection, and query-hook ownership.

## Project Structure

### Documentation (this feature)

```text
specs/019-user-profile-settings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── update-user-profile-contract.md
│   └── change-password-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   └── users.ts (update functions for name/password)
    ├── services/
    │   ├── userProfileService.ts (new: name/password update logic)
    │   └── authService.ts (reference existing password validation)
    └── routers/
        ├── userRouter.ts (new: /user routes)
        └── apiRouter.ts (register userRouter)

web/
└── src/
    ├── api/
    │   └── users.ts (new: profile update/password change calls)
    ├── hooks/
    │   ├── useUpdateProfileForm.ts (new: name update hook)
    │   └── useChangePasswordForm.ts (new: password change hook)
    ├── components/
    │   ├── user/
    │   │   ├── ProfileSettingsForm.tsx (name update form)
    │   │   ├── ChangePasswordForm.tsx (password change form)
    │   │   └── UserSettingsPage.tsx (email display + form container)
    │   └── layout/
    │       └── UserMenu.tsx (add Settings link)
    └── routes/
        └── user/
            └── settings.tsx (new: /user/settings route)
```

**Structure Decision**: Implement profile/password update logic in a new `userProfileService.ts`, expose via two endpoints (`PATCH /user/profile`, `PUT /user/password`) authenticated by session only. Frontend creates dedicated settings route with separate custom hooks for name and password forms. Email field read-only via HTML `disabled` attribute and backend rejection.

## Phase 0: Research

Research resolves the following implementation decisions:

1. Existing password validation rules and enforcement in `authService.ts` (reuse for password change validation).
2. Password hashing and verification flow for password change scenario.
3. Session user ID extraction pattern for authenticated endpoints (follow existing `getAuthenticatedUserId` pattern).
4. Email field display strategy (read-only input with no form submission inclusion).
5. Error messaging for password mismatch, current password verification failure, validation rule violations.
6. Audit logging scope for password changes.
7. Form error state management and field-level validation timing (on blur, on submit).

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): User profile update payloads, password change payload, validation rules, and audit tracking requirements.
2. [contracts/update-user-profile-contract.md](contracts/update-user-profile-contract.md): PATCH `/user/profile` endpoint specification (session auth, name fields, email rejection).
3. [contracts/change-password-contract.md](contracts/change-password-contract.md): PUT `/user/password` endpoint specification (current password verification, new password validation, audit logging).
4. [quickstart.md](quickstart.md): implementation order and validation checklist.
5. Update `.github/copilot-instructions.md` SPECKIT context pointer to this plan.

## Complexity Tracking

No constitution violations or exceptions required for this feature.
