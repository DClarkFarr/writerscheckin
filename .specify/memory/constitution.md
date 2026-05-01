<!--
SYNC IMPACT REPORT
==================
Version change: (new) → 1.0.0
Added sections: All (initial constitution generated from codebase analysis)
Removed sections: None (template placeholders replaced)
Modified principles: None (initial)
Templates requiring updates:
  ✅ constitution.md — this file
  ⚠ .specify/templates/plan-template.md — may reference generic principles; review against constitution
  ⚠ .specify/templates/spec-template.md — review scope/requirements alignment
  ⚠ .specify/templates/tasks-template.md — review task categories against principles
Deferred TODOs: None
-->

# Writers CheckIn Constitution

## Project Overview

Writers CheckIn is a full-stack web application [TODO]. It
uses a monorepo layout with two projects: `express/` (Node.js/TypeScript API server) and `web/`
(React/TypeScript SPA). Both are served from the same origin — Express serves the compiled SPA
as a static fallback and exposes all API routes under `/api`.

**Technology Stack:**

- **Backend**: Express 5, TypeScript (strict), MongoDB (native driver), express-session,
  bcryptjs, Nodemailer, Multer, Helmet, CORS
- **Frontend**: React 19, TypeScript (strict), Vite 8, TanStack Router (file-based),
  TanStack Query v5, Zustand, Axios, Tailwind CSS v4, Flowbite UI, TipTap, dnd-kit
- **Deploy**: Bash scripts with git-pull-based CI, change detection, process restart

## Core Principles

### I. Strict TypeScript Throughout

TypeScript strict mode MUST be enabled in both `express/tsconfig.json` and `web/tsconfig.app.json`.
`noUnusedLocals` and `noUnusedParameters` are enforced in the frontend. All new code MUST compile
without errors or suppressions. Type assertions (`as`) MUST only be used when the narrower type is
provably correct; do not use `any`.

Use the `@/` path alias (maps to `web/src/`) for all frontend imports. Use relative paths in
`express/src/`.

### II. Layered Backend Architecture (Models → Services → Routers)

The Express backend MUST follow a strict three-layer architecture:

1. **Models** (`express/src/models/`) — define TypeScript interfaces, MongoDB collection helpers,
   and index setup. Each entity gets its own file. Use the generic type system:
   - `ModelDocument<TDefinition>` for full documents with `_id` and timestamps.
   - `ModelInsertInput<TDefinition>` for insert payloads.
   - `ModelBlueprint<TDefinition>` for the raw shape.
   - Call `ensureXxxIndexes()` during app startup to create MongoDB indexes.

2. **Services** (`express/src/services/`) — contain all business logic. Services MUST validate
   input using helpers from `utils/validators.ts`, throw typed errors (`AuthError`,
   `ValidationError`, or descriptive `Error` messages), call model functions, record audit events,
   and return typed response objects. Services MUST NOT reference `req`/`res`.

3. **Routers** (`express/src/routers/`) — contain only route definitions. Each handler extracts
   data from `req`, calls one or more services, and writes `res`. All async handlers MUST be
   wrapped with `handleAsync()`. Routers MUST NOT contain business logic.

New routers MUST be registered in `apiRouter.ts` using `applyNestedRouter()`.

### III. Centralized Error Handling

All errors flow through `handleError()` in `utils/errorHandler.ts` via the `handleAsync()` wrapper.
New error types MUST extend the existing hierarchy:

- `AuthError(message, status)` — authentication/authorization failures (401, 403).
- `ValidationError(field, message)` — field-level validation failures (400).
- Plain `Error` with message patterns `"not found"`, `"Too many attempts"`, `"required"` are mapped
  to 404, 429, 400 respectively.

Never swallow errors silently. Never call `res.json()` inside a try/catch and also re-throw; let
`handleAsync` catch and route to `handleError`. HTTP status codes MUST be set semantically.

Errors at severity 500+ are logged with `console.error`; below 500 with `console.warn`. All logged
errors include a `referenceId`, `timestamp`, `method`, and `route` for traceability.

### IV. Security-First Implementation

Security practices are NON-NEGOTIABLE:

- **Passwords**: MUST be hashed with bcryptjs at 12 salt rounds. Never store or log plaintext
  passwords. Use `hashPassword()` / `verifyPassword()` from `utils/passwords.ts`.
- **Rate limiting**: All auth endpoints (login, signup, reset) MUST call
  `assertAuthAttemptAllowed()` before processing and `recordAuthAttempt()` after. Max 5 attempts
  per 15-minute window per identifier + IP.
- **Sessions**: Stored in MongoDB via `MongoSessionStore`. Sessions MUST include `expiresAt` with
  a TTL index for automatic cleanup. On password reset, all sessions for that user MUST be
  invalidated with `endSessionsByUserId()`.
- **Password reset codes**: MUST be hashed before storage (`hashResetCode()`). Comparison MUST
  use a timing-safe method to prevent timing attacks.
- **File uploads**: MUST validate MIME type (`image/*` only) and enforce a 5 MB size limit.
  Filenames MUST be sanitized (lowercase, alphanumeric + dots only, timestamp prefix).
- **Security headers**: Helmet MUST be applied on every request. CORS MUST specify an explicit
  origin and require `credentials: true`. Never use wildcard CORS with credentials.
- **Sensitive data**: MUST NOT reveal whether an account exists in reset-password flows
  (return the same message regardless).
- **Dev-only logging**: Reset codes or other secrets MAY be logged to console in development mode
  only, gated by `process.env.MODE !== "production"`.

### V. Environment Configuration via Typed Proxy

All environment variables MUST be accessed through the `env` proxy from `utils/env.ts`. Direct
`process.env` access MUST NOT appear anywhere else in the Express codebase. Each variable has a
typed parser function with a safe default for development. Adding new environment variables
requires adding the key to `EnvConfig`, a parser function, and registering it in the proxy.

Required variables: `PORT`, `MODE`, `MONGO_URL`, `MONGO_USER`, `MONGO_DB`, `MONGO_PW`,
`SESSION_SECRET`, `SESSION_COOKIE_NAME`, `MAILER_GMAIL_USER`, `MAILER_GMAIL_PASS`,
`MAILER_FROM_NAME`, `MAILER_FROM_EMAIL`.

### VI. Frontend: Hook + Component Separation for Forms

Forms MUST be split into two parts:

1. **A custom hook** (`web/src/hooks/useXxxForm.ts`) — owns all state (`fields`, `touched`,
   `fieldErrors`, `formError`, `isSubmitting`), client-side validation logic,
   TanStack Query `useMutation`, and API error mapping. Returns a typed props interface
   (`XxxFormProps`). The hook MUST NOT render any JSX.

2. **A pure presentational component** (`web/src/components/forms/XxxForm.tsx`) — receives only
   the typed props interface and renders the Flowbite UI form. The component MUST NOT contain
   business logic or direct API calls.

Pages wire the two together: `const formProps = useXxxForm({ onSuccess: ... }); return <XxxForm {...formProps} />;`

Client-side validation runs field-by-field using a `validateField(name, value)` function. Errors
only show after the field has been `touched` (blurred) or after a submit attempt. API errors are
mapped to user-friendly messages in a `mapApiError()` function inside the hook.

### VII. File-Based Routing with TanStack Router

Frontend routes MUST live in `web/src/routes/` using TanStack Router file conventions:

- `__root.tsx` — root route wrapping `<RootLayout>` (auth sync via React Query + Zustand).
- `_auth.tsx` — pathless layout route for unauthenticated pages (e.g., centered card layout).
- `index.tsx` — home route (`/`).
- `_auth/<pagename>.tsx` — nested auth layout routes.
- Pages MUST live in `web/src/pages/` and be referenced from route files; route files MUST NOT
  contain component logic beyond a one-liner `component: PageComponent`.

Protected routes MUST use `useAuthRedirect()` to redirect unauthenticated users to `/login`,
preserving the intended destination in `search.redir`.

The auth state is loaded once at the root level via a TanStack Query `queryKey: ["me"]` call with
`staleTime: 5 minutes`. The result is written to the `useAuthStore` Zustand store.

### VIII. API Client & Data Fetching

All HTTP calls from the frontend MUST go through `apiClient` from `lib/apiClient.ts` (Axios
instance with `baseURL: import.meta.env.VITE_API_BASE_URL` and `withCredentials: true`).

Each API module in `web/src/api/` MUST:

- Export typed input interfaces and call `apiClient`.
- Wrap every call in try/catch and re-throw using `throw await toApiError(err)`.
- Return typed response objects (never raw Axios responses).

Server-mutating operations MUST use `useMutation`. Read operations MUST use `useQuery` or
`useSuspenseQuery` for TanStack Query caching. Query keys MUST be descriptive arrays.

### IX. Audit Logging for Sensitive Actions

All authentication actions (signup, login, logout, reset-request, reset-confirm) MUST call
`recordAuditEvent()` from `utils/audit.ts`. The audit record MUST include `action`, `userId`,
`email`, and `ipAddress`. Extend `AuditAction` union type when adding new sensitive actions.

### X. Deployment & Change Detection

Deployment is fully scripted via `deploy.sh`. The script:

1. Checks working directory clean state.
2. Pulls latest from origin.
3. Detects which projects changed (`web/` or `express/`) by diffing git commits.
4. Builds only changed projects.
5. Restarts the server process.

New deployment commands MUST be added as individual scripts in `deploy/commands/` and sourced
through `common.sh`. Shell scripts MUST use `set -euo pipefail` and source shared utilities from
`deploy/lib/`.

## Technical Constraints

- MongoDB MUST be accessed only through the `getDb()` singleton from `utils/db.ts` and collection
  accessors from `models/collections.ts`. Direct `MongoClient` usage MUST NOT appear in service
  or router code.
- The App class in `utils/app.ts` MUST remain a singleton. Setup methods MUST be called in the
  order defined in `server.ts` (environment → security → CORS → cookies → database → sessions →
  routes).
- File uploads are stored under `uploads/characters/` relative to the Express working directory.
  The `uploads/` directory at repo root is served as a static directory by the upload router.
- The SPA build output (`web/dist/`) is served by the `webRouter` as a catch-all fallback.
  This MUST always be the last router registered.
- Email sending via Gmail SMTP (Nodemailer). Email templates MUST be plain functions in
  `services/emailTemplates/` that return `{ subject, text, html }` with NO external dependencies.
- The `cn()` utility (`lib/utils.ts`) MUST be used for all conditional className composition
  in the frontend (combines `clsx` + `tailwind-merge`).
- The `COLLECTIONS` constant in `models/collections.ts` is the single source of truth for
  MongoDB collection names. New collections MUST be added here before use.

## Development Workflow

1. New backend features: add model definition → add collection accessor → add service functions →
   add router file → register in `apiRouter.ts`.
2. New frontend features: add API module in `api/` → add hook in `hooks/` → add component in
   `components/` → add page in `pages/` → add route file in `routes/`.
3. Environment variables: update `.env` locally AND add to `utils/env.ts` in Express.
4. New MongoDB indexes MUST be added to the model's `ensureXxxIndexes()` function which is
   called at startup in `server.ts`.
5. All TypeScript MUST compile cleanly (`tsc --noEmit`) before deploying.

## Governance

This constitution represents the authoritative engineering principles for Writers CheckIn.
All new features and changes MUST comply with these principles. Any amendment requires:

- Documenting the change in this file with a version bump.
- Updating relevant templates in `.specify/templates/` if the amendment affects patterns.
- MAJOR bump: removal or redefinition of an existing principle.
- MINOR bump: new principle or section added.
- PATCH bump: clarifications, wording fixes, non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-04-30 | **Last Amended**: 2026-04-30
