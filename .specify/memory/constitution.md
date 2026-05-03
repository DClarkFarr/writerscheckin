<!--
SYNC IMPACT REPORT
==================
Version change: 1.8.1 → 1.8.2 (PATCH — clarified query-key method ownership, mutateAsync usage, and no-barrel policy for query modules)
Modified sections:
  - Principle XII: Frontend Query Hooks vs Direct API Calls — clarified key ownership via per-hook methods, mutateAsync-first usage, and no-barrel query exports
Added sections:
  - None
Removed sections: None
Templates requiring updates:
  ✅ constitution.md — this file
  ✅ .specify/templates/plan-template.md — no updates needed (existing patterns remain valid)
  ✅ .specify/templates/spec-template.md — no updates needed
  ✅ .specify/templates/tasks-template.md — no updates needed
Deferred TODOs: None
-->

# Writers CheckIn Constitution

## Project Overview

Writers CheckIn is a mobile-first web app for writing groups. Writers join groups, view upcoming
meetings, check in to confirm attendance, and see who else will attend. Each meeting shows who is
reading, presenting, or participating in another role. The core user need is answered in one glance:
_What is my next meeting, am I checked in, who else is coming, and who is reading?_

The product is modern, clean, spacious, and simple. It avoids dashboard clutter and prioritizes
quick comprehension. The experience is calm and polished — closer to a mobile app than a web tool.

The codebase uses a monorepo layout with two projects: `express/` (Node.js/TypeScript API server)
and `web/` (React/TypeScript SPA). Both are served from the same origin — Express serves the
compiled SPA as a static fallback and exposes all API routes under `/api`.

**Technology Stack:**

- **Backend**: Express 5, TypeScript (strict), MongoDB (native driver), express-session,
  bcryptjs, Nodemailer, Multer, Helmet, CORS
- **Frontend**: React 19, TypeScript (strict), Vite 8, TanStack Router (file-based),
  TanStack Query v5, Zustand, Axios, Tailwind CSS v4, ShadCN UI, TipTap, dnd-kit, dayjs
- **Deploy**: Bash scripts with git-pull-based CI, change detection, process restart

## Core Principles

### I. Strict TypeScript Throughout

TypeScript strict mode MUST be enabled in both `express/tsconfig.json` and `web/tsconfig.app.json`.
`noUnusedLocals` and `noUnusedParameters` are enforced in the frontend. All new code MUST compile
without errors or suppressions. Type assertions (`as`) MUST only be used when the narrower type is
provably correct; do not use `any`.

Use the `@/` path alias (maps to `web/src/`) for all frontend imports. Use relative paths in
`express/src/`.

### II. Layered Backend Architecture (Models → Services → Routers → Utils)

The Express backend MUST follow a strict four-layer architecture. Each layer has exclusive
responsibilities and MUST NOT do the work of another layer.

#### Layer 1 — Models (`express/src/models/`)

Model files are the **only** place in the codebase that may touch MongoDB. This includes every
call to `getCollection()`, every `find`, `findOne`, `insertOne`, `updateOne`, `deleteOne`, and
any use of the MongoDB `Collection` type.

Each entity gets its own model file (e.g., `users.ts`, `sessions.ts`). A model file MUST contain:

- **Type definitions** using the generic type system from `models/types.ts`:
  - `interface XxxDefinition extends BaseModelBlueprint` — the entity's field shape.
  - `type XxxBlueprint = ModelBlueprint<XxxDefinition>` — raw document shape.
  - `type XxxDocument = ModelDocument<XxxDefinition>` — full document with `_id` and timestamps.
  - Input interfaces for create/update operations (e.g., `CreateXxxInput`, `UpdateXxxInput`).
- **Collection accessor** — a `getXxxCollection()` function that calls `getCollection<XxxDocument>(COLLECTIONS.xxx)`.
- **Index setup** — an `ensureXxxIndexes()` async function that creates all MongoDB indexes for
  the entity. Called once at startup in `server.ts`.
- **All CRUD functions** for the entity — `createXxx`, `getXxxById`, `getXxxByYyy`, `listXxx`,
  `updateXxxById`, `deleteXxxById`, etc. Each function calls the collection accessor and returns
  typed results. These MUST be plain async functions (not classes).
- **Pure helper functions** that are data-only and entity-specific (e.g., `normalizeEmail()` in
  `users.ts`, `assertNotExpired()` in `sessions.ts`).

Model functions MUST NOT contain business logic, validation of user inputs, rate limiting, or
audit logging. They MUST only translate between the service layer and MongoDB.

Timestamps are managed via `createTimestamps()` (sets `createdAt`) and `touchTimestamps()` (sets
`updatedAt`) from `models/types.ts`. Always spread these into insert/update payloads.

Use `ensureObjectId(value, label)` from `models/types.ts` to safely coerce `string | ObjectId`
to `ObjectId` before passing to MongoDB queries.

`models/collections.ts` is the single source of truth for collection names via `COLLECTIONS`
(a `const` object). `getCollection<T>(name)` accesses `db` from `utils/db.ts`. New entities
MUST register their collection name in `COLLECTIONS` before writing any model code.

`models/types.ts` MUST NOT be modified to add entity-specific types; those belong in each
entity's own model file.

**Index Naming and Partial Filter Expressions**

When creating a MongoDB index that uses `partialFilterExpression`, the index MUST have an
explicit `name` specified. This prevents confusion and ensures deterministic index management.

Supported syntax for partial filter expressions:

```javascript
{
  key: { fieldName: 1 },
  partialFilterExpression: {
    fieldName: { $exists: true },
  },
  name: "idx_fieldName_exists",
}
```

The inverse (checking for non-existence) MUST NOT use `{ $exists: false }`. Instead, use:

```javascript
{
  key: { fieldName: 1 },
  partialFilterExpression: {
    fieldName: null,
  },
  name: "idx_fieldName_null",
}
```

All sparse or conditional indexes MUST be named explicitly in the index definition.

#### Layer 2 — Services (`express/src/services/`)

Services contain all **business logic**. They coordinate multiple model functions, enforce
business rules, and produce the final response data for the router layer.

A service function MUST:

- Accept plain data inputs (primitives, POJOs) — never `req` or `res`.
- Validate inputs using helpers from `utils/validators.ts` (e.g., `validateEmail()`,
  `requireString()`, `requireUserId()`).
- Call model functions to read/write data — never call `getCollection()` directly.
- Throw typed errors (`AuthError`, `ValidationError`, plain `Error`) for all failure paths.
- Call `recordAuditEvent()` for sensitive actions.
- Return typed response objects (not raw `ModelDocument` shapes unless appropriate).

Services MUST NOT access `req`, `res`, or any HTTP-level concept. They MUST NOT call
`getCollection()` or import from `models/collections.ts` directly.

A service may call functions from multiple model files to combine data. For example,
`authService.ts` calls functions from `users.ts`, `sessions.ts`, `authAttempts.ts`, and
`passwordResets.ts`.

Services that require only logic around a single model and no business rules (e.g.,
`authAttemptService.ts`) are still services — they encapsulate the logic (rate-limit window
calculation, attempt counting) so the router and other services stay clean.

Email templates live in `services/emailTemplates/` and MUST be pure functions returning
`{ subject, text, html }` with no dependencies on external services.

#### Layer 3 — Routers (`express/src/routers/`)

Routers contain **only route definitions**. Each route handler:

1. Extracts data from `req` (body, params, query, IP, session).
2. Calls one or more service functions with plain arguments.
3. Writes the HTTP response via `res`.

All async handlers MUST be wrapped with `handleAsync()` from `utils/asyncHandler.ts`. Routers
MUST NOT contain business logic, direct model calls, or validation logic.

Each router is created with `express.Router({ mergeParams: true })` and registered in
`apiRouter.ts` via `applyNestedRouter(apiRouter, "/path", xRouter)`.

The session is accessed in routers by casting `req.session` to the typed `AuthSession` shape.

#### Layer 4 — Utils (`express/src/utils/`)

Utils are **cross-cutting infrastructure** shared across all layers. Each util has a single
responsibility:

| File              | Responsibility                                                                      |
| ----------------- | ----------------------------------------------------------------------------------- |
| `app.ts`          | Singleton Express app with ordered setup methods                                    |
| `asyncHandler.ts` | `handleAsync()` wrapper that routes errors to `handleError()`                       |
| `audit.ts`        | `recordAuditEvent()` — structured audit logging                                     |
| `db.ts`           | `db` singleton reference (set after `connectToMongo()`)                             |
| `env.ts`          | Typed proxy for all environment variables                                           |
| `errorHandler.ts` | `handleError()` + `resolveError()` — maps errors to HTTP responses                  |
| `errorLogging.ts` | `logError()` — structured error logging with stack source extraction                |
| `mongo.ts`        | `connectToMongo()` / `disconnectFromMongo()` — raw MongoClient lifecycle            |
| `passwords.ts`    | `hashPassword()` / `verifyPassword()` — bcrypt wrappers                             |
| `routes.ts`       | `applyNestedRouter()` + `assertParamIsString()` helpers                             |
| `sessionStore.ts` | `MongoSessionStore` — express-session store backed by MongoDB                       |
| `validators.ts`   | `requireString()`, `validateEmail()`, `validatePassword()`, `requireUserId()`, etc. |

Utils MUST NOT contain business logic or entity-specific rules. Validators throw `ValidationError`
or `AuthError`; they do not call model functions.

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
   the typed props interface and renders the ShadCN UI form. The component MUST NOT contain
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

### X. Date Formatting & Time Utilities

dayjs MUST be used as the canonical date formatting and parsing library across the entire
frontend. date-fns or any other date library MUST NOT be used.

Frontend date handling rules:

- **All date formatting**: Use the centralized `formatDate()`, `formatTime()`, `formatDateTime()`,
  utilities from `web/src/lib/dateFormat.ts`. Import and call these
  utilities instead of calling `dayjs().format()` directly in component code.
- **Parsing dates**: Use `dayjs(value)` directly when parsing ISO strings, timestamps, or Date
  objects. Always validate with `.isValid()` before formatting.
- **Date constants**: Define common format strings as named exports in `dateFormat.ts` (e.g.,
  `DISPLAY_DATE_FORMAT`, `ISO_FORMAT`). Do not hard-code format strings in components.
- **Time zones**: If time zone handling is needed, configure it in `dateFormat.ts` using dayjs
  plugins (e.g., `dayjs.extend(utc)`, `dayjs.extend(timezone)`). All time zone logic MUST be
  centralized.
- **Locale**: If locale-aware formatting is needed, configure dayjs locale plugins in
  `dateFormat.ts` at initialization, never in individual components.

Backend date handling (Express):

- Store all dates in MongoDB as ISO strings or timestamps. Use consistent date storage strategy
  (prefer ISO 8601 strings or Unix timestamps).
- When returning dates in API responses, use ISO 8601 format (JavaScript `Date.toISOString()`).
  The frontend will parse with dayjs as needed.

### XI. Product Design Imperatives (NON-NEGOTIABLE)

These rules govern every screen, component, and interaction. They MUST be applied before any
other visual decision. Technical correctness is not a substitute for meeting these criteria.

#### Layout & Chrome

- **Mobile-first**: All layouts MUST be designed and tested at mobile widths first. Desktop is
  an enhancement, not the default.
- **Centered phone card on desktop**: On viewports wider than mobile breakpoint, the entire app
  content MUST render as a centered, phone-sized white content card (`max-w-sm` or similar),
  with a **dark sky-blue full-page background** filling the rest of the viewport. The card MUST
  have rounded corners (`rounded-2xl` or similar) and a soft shadow.
- **White content area**: The card/content area background is white (or near-white). Content is
  never placed directly on the sky-blue background.
- **Navigation minimal**: Navigation MUST be minimal — a single bottom tab bar or a compact
  top bar. No sidebars, no hamburger menus unless unavoidable on a specific nested screen.

#### Color & Typography

- **Primary action color**: Bright sky blue MUST be used for primary buttons, key CTAs, and
  active/selected states. This is the single accent color — do not introduce secondary accent
  colors without explicit justification.
- **Text on white**: Body text MUST use dark gray (not pure black) for readability. Muted text
  for secondary labels MUST pass WCAG AA contrast against white.
- **Accessible contrast**: All text and interactive states MUST meet WCAG AA contrast ratios
  (4.5:1 for normal text, 3:1 for large text and UI components).
- **Readable typography**: Font sizes MUST be comfortable at arm's length on a phone screen.
  Body text MUST NOT be smaller than `text-sm` (14px). Labels MUST NOT be smaller than `text-xs`
  (12px). Prefer `text-base` for primary reading content.

#### Content Density & Spacing

- **Generous spacing**: Use ample padding inside cards and between list items. Prefer `gap-4` or
  `gap-6` between major sections. Avoid cramming information.
- **Card-based content**: Meetings, groups, and members MUST be displayed in clear card
  components. Never render data as bare text lists.
- **One primary action per screen**: Each screen MUST have at most one primary (sky-blue) CTA
  that is immediately obvious. Secondary actions use `outline` or `ghost` variants.

#### Interaction & States

- **Obvious interactive states**: Every interactive element MUST have clearly visible hover,
  focus, and active states. Focus rings MUST be visible (do not suppress `outline` without
  replacing with a visible `ring`).
- **Check-in is the primary action**: The meeting check-in action MUST be the most visually
  prominent element on a meeting screen. It MUST be reachable in ≤2 taps from the home screen.
- **Loading states**: Skeleton placeholders MUST be used for any content that loads
  asynchronously. Spinners are reserved for actions (button loading states), not page content.
- **Empty states**: Every list or card grid MUST have a purposeful empty state with a short
  message and, where appropriate, a primary CTA (e.g., "No upcoming meetings — find a group").

#### Domain-Specific UX Rules

- **Next meeting is always visible**: The home screen MUST immediately surface the user's next
  upcoming meeting (or a prompt to join a group if none exists). This is the first thing a user
  sees after logging in.
- **Attendance visibility**: Meeting screens MUST clearly show: who has checked in, who is
  attending, and the reading/presenting roles. This information MUST be scannable at a glance
  (avatars + names, not just counts).
- **Group context**: Every meeting MUST display its parent group. Users viewing a meeting always
  know which group it belongs to.
- **Role clarity**: Reading, presenting, and participation roles MUST be visually distinct
  (e.g., a badge or icon). A user MUST be able to tell their own role without reading fine print.

#### Component Inventory & Composition Trees

The following components are available. Use the documented composition tree to assemble UI
correctly — do not skip levels or mix sub-components from different parents.

**Button** — use for all clickable actions.

```
Button  (variants: default | outline | secondary | ghost | destructive | link)
        (sizes:    default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg)
```

- Use `asChild` to render as a different element (e.g., `<Link asChild>`) via Radix `Slot`.
- Use `size="icon"` variants for icon-only buttons; always include `<span className="sr-only">`.
- Use `variant="destructive"` for irreversible actions.

**Field / FieldGroup** — the canonical wrapper for all form inputs. Never use a raw `<label>` +
`<input>` pair outside of a `Field`.

```
FieldGroup
└── Field  (orientation: vertical | horizontal | responsive)
    ├── FieldLabel    — wraps Label; drives disabled/invalid styling via group selectors
    ├── FieldTitle    — alternative to FieldLabel for non-label headings
    ├── Input | Textarea | Switch | ...  — the actual control
    ├── FieldDescription  — helper text below the control
    └── FieldContent  — container for controls with separate description
FieldSet
└── FieldLegend  (variant: legend | label)
```

- Mark invalid state with `aria-invalid="true"` on the input AND `data-invalid={true}` on the
  `Field` — this triggers red styling via CSS attribute selectors.
- Mark disabled state with `data-disabled={true}` on the `Field`.
- Use `FieldGroup` to lay out multiple `Field` blocks in a form; it handles responsive stacking.
- Use `FieldSet` + `FieldLegend` for groups of checkboxes or radio buttons.

**InputGroup** — wraps `Input` or `Textarea` to add inline/block addons (icons, text, buttons).

```
InputGroup
├── InputGroupAddon  (align: inline-start | inline-end | block-start | block-end)
│   └── icon | text | InputGroupButton
└── Input | Textarea  (add data-slot="input-group-control" to the native input)
```

- Use `align="inline-start"` for a leading icon, `align="inline-end"` for a trailing action.
- Do not use `InputGroup` for standalone inputs; use `Field` + `Input` directly.

**Card** — use for contained sections of content.

```
Card  (size: default | sm)
├── CardHeader
│   ├── CardTitle
│   ├── CardDescription
│   └── CardAction   — placed top-right; use for a Button or Badge
├── CardContent
└── CardFooter
```

**Dialog** — use for modal overlays requiring user attention or confirmation.

```
Dialog
├── DialogTrigger  (asChild to use a custom trigger element)
└── DialogContent  (showCloseButton=true by default)
    ├── DialogHeader
    │   ├── DialogTitle
    │   └── DialogDescription
    └── DialogFooter
```

- Always provide `DialogTitle` (accessibility). Use `className="sr-only"` if visually hidden.
- Use `showCloseButton={false}` only when a custom close action is provided.

**DropdownMenu** — use for contextual action menus.

```
DropdownMenu
├── DropdownMenuTrigger  (asChild to use a Button)
└── DropdownMenuContent
    ├── DropdownMenuGroup
    │   ├── DropdownMenuLabel
    │   ├── DropdownMenuItem            (variant: default | destructive)
    │   ├── DropdownMenuCheckboxItem
    │   └── DropdownMenuRadioGroup
    │       └── DropdownMenuRadioItem
    ├── DropdownMenuSeparator
    └── DropdownMenuSub
        ├── DropdownMenuSubTrigger
        └── DropdownMenuSubContent
```

- Always wrap `DropdownMenuTrigger` with `asChild` + a `Button` (never a raw `<div>`).
- Use `DropdownMenuGroup` to cluster related items; use `DropdownMenuLabel` to name groups.
- Use `variant="destructive"` on `DropdownMenuItem` for delete/irreversible actions.

**Item / ItemGroup** — use for list rows (not for menus — use DropdownMenu for that).

```
ItemGroup
├── ItemSeparator
└── Item  (variant: default | outline | muted)  (size: default | sm | xs)
    ├── ItemMedia    (variant: default | icon | image)
    ├── ItemContent
    │   ├── ItemTitle
    │   └── ItemDescription
    └── ItemActions
```

- Use `Item` with `asChild` to render list rows as links (`<Link asChild>`).
- `ItemMedia` with `variant="image"` crops images to a fixed square thumbnail.
- `ItemActions` renders at the far right; use for icon `Button` controls.

**Tabs** — use for switching between content sections.

```
Tabs  (orientation: horizontal | vertical)
├── TabsList  (variant: default | line)
│   └── TabsTrigger
└── TabsContent
```

- Use `variant="line"` on `TabsList` for an underline-style tab bar.
- Use `orientation="vertical"` for sidebar-style navigation.

**Sheet** — use for slide-over panels (side navigation, detail drawers).
**Drawer** — use for bottom-sheet patterns on mobile.
**Popover** — use for non-modal floating content anchored to a trigger.
**HoverCard** — use for preview cards on hover (not for interactive content).
**Tooltip** — use for short labels on icon-only buttons. Wrap with `CustomTooltip` from
`components/helpers/CustomTooltip.tsx` if a reusable tooltip pattern is needed.

**Badge** — use for status labels, counts, and tags inline with text.
**Alert** — use for page-level feedback messages (success, error, warning, info).
**Skeleton** — use as a loading placeholder; match the shape of the real content.
**Spinner** — use for indeterminate loading states within buttons or inline.
**Separator** — use for visual dividers between sections.

**Collapsible** — use for expand/collapse sections.
**Toggle / ToggleGroup** — use for binary or exclusive-choice button sets.
**Switch** — use for boolean on/off settings (inside a `Field`).
**Calendar** — use for date pickers.
**Command** — use for command palettes and searchable lists.
**Breadcrumb** — use for hierarchical navigation paths.

**ColorPaletteDropdown** — project-specific component in `ui/`; use for color selection UI.

#### Extension Rules

Default shadcn component files in `web/src/components/ui/*` are treated as baseline library
primitives. When a ShadCN primitive does not meet a requirement, follow this decision tree:

**Rule 1: Add Variants/Props to the Component (Preferred)**

If a styling or behavioral requirement can be satisfied by adding a new variant or prop to the
ShadCN component itself (e.g., adding `size="lg"` to `Input`, adding new color variants to
`Button`):

1. Modify the component file to add the variant/prop using `cva()` from `class-variance-authority`.
2. Apply the variant/prop at component invocation (`<Input size="lg" />`).
3. NEVER create utility classes in `index.css` that shadow component responsibilities.

Example — adding a size prop to `Input`:

```tsx
// web/src/components/ui/input.tsx
const inputVariants = cva([...], {
  variants: {
    size: {
      default: "h-10 px-3 py-2 text-sm",
      lg: "h-12 px-4 py-3 text-base",
    },
  },
});

function Input({ className, size = "default", ...props }) {
  return <input className={cn(inputVariants({ size }), className)} {...props} />;
}
```

Then use it: `<Input size="lg" />` — NOT `<Input className="auth-input-lg" />`.

**Rule 2: Compose Multiple ShadCN Components (If No Variant Needed)**

If the requirement needs multiple ShadCN sub-components (e.g., Field + FieldLabel + Input +
helper text):

1. Compose them in a new component in `web/src/components/<category>/` (e.g., `FormField.tsx`).
2. Import ShadCN primitives from `@/components/ui/`.
3. The new component MAY accept a `className` prop for outer layout adjustments (gaps, width).
4. DO NOT use this for styling the internal ShadCN components — use their variants/props instead.

Example:

```tsx
// web/src/components/forms/FormField.tsx
export function FormField({ label, error, children }) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {error && (
        <FieldDescription className="text-destructive">
          {error}
        </FieldDescription>
      )}
    </Field>
  );
}
```

**Rule 3: Compose in a Page/Route Component (If Layout-Specific)**

If the requirement is specific to a single page (e.g., a login form with custom spacing or
responsive behavior):

1. Compose and style in the page component itself.
2. Do not extract to `web/src/components/` unless used in 2+ pages.

**FORBIDDEN PATTERNS (Never Do This):**

- ❌ Add utility classes to `web/src/index.css` like `.auth-input-lg` and apply them via
  `className="auth-input-lg"`. This creates confusion between Tailwind classes and custom CSS,
  conflicts with component variants, and is unmaintainable.
- ❌ Add styling-only classNames to component props. WRONG: `<Input className="h-12 px-4 py-3" />`.
  RIGHT: `<Input size="lg" />` (after adding the size variant to Input).
- ❌ Modify `web/src/components/ui/*` files without explicit task/spec guidance UNLESS adding a
  variant/prop that is required by the feature. Always justify the change in a code comment or
  commit message.

### XII. Frontend Query Hooks vs Direct API Calls

Frontend components and hooks MUST NOT directly call XHR/HTTP methods from `@/api/*` modules.
Instead, all data fetching MUST be wrapped in custom query hooks defined in `@/queries/*`.

Rationale: This separation ensures that caching, reuse, and error handling are centralized in
one place, reducing duplication and making the data-fetching contract explicit.

All query hooks MUST:

- Export a `.key` method that generates the query key array (e.g., `useGroupQuery.key(groupId)`).
  This ensures consistency between hook invocations and allows cache invalidation from other hooks.
- Use `useQuery` or `useSuspenseQuery` from TanStack Query v5 with a consistent `queryKey`.
- Wrap the `queryFn` call to the corresponding `@/api/*` function with try/catch and error mapping.
- Return typed data with appropriate `enabled` state for conditional fetching.
- Own their query key method next to the hook (for example `groupQueryKey(...)` in the same file as `useGroupQuery`).

Mutation wrappers MUST:

- Use `mutateAsync` as the default invocation style when asynchronous flow control is needed.
- Destructure mutation utilities from wrapper hooks where practical (for example `const { mutateAsync } = useXMutation()`).
- Use query key methods exported by query hooks when performing cache reads/writes/invalidation.

Query modules MUST NOT rely on barrel export files for imports/exports. Import query hooks by explicit file path.

When a hook-managed flow mutates server-backed state, optimistic updates MUST be treated as the
default behavior. The UI SHOULD reflect the user's action immediately while the request is in
flight, with deterministic rollback behavior if the request fails.

Optimistic update patterns MUST:

- Apply updates only to the smallest affected cache scope.
- Capture pre-change state before applying optimistic changes.
- Restore prior state if the mutation fails.
- Reconcile optimistic state with confirmed server state after success.
- Avoid direct component-level mutation calls that bypass the shared hook contract.

Pattern (from `useGroupQuery.ts`):

```typescript
export const groupQueryKey = (groupId: string | undefined) => [
  "groups",
  groupId,
];

export const useGroupQuery = (
  { groupId }: UseGroupQueryProps,
  { enabled }: BaseQueryOptions = {},
) => {
  return useQuery({
    queryKey: groupQueryKey(groupId),
    queryFn: () => getGroupById(groupId ?? ""),
    enabled: enabled !== false && !!groupId,
  });
};

useGroupQuery.key = groupQueryKey;
```

Mutations to server state MUST use `useMutation` from TanStack Query and wrap the corresponding
`@/api/*` function. Do not call API functions directly from components or event handlers.

Pages and top-level route components may instantiate these hooks. Lower-level components receive
query results as props or via context, never directly calling hooks or API functions.

### XIII. Deployment & Change Detection

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
- The `cn()` utility for class name composition in the frontend (combines `clsx` + `tailwind-merge`).
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

**Version**: 1.8.2 | **Ratified**: 2026-04-30 | **Last Amended**: 2026-05-02
