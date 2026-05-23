# Implementation Plan: Group Notify Hours Before Form Field

**Branch**: `025-group-notify-hours-form` | **Date**: 2026-05-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/025-group-notify-hours-form/spec.md`

## Summary

Add an editable `notifyAttendanceHoursBefore` field to the group settings form so that group owners can control when the attendance notification email is sent, and new meetings inherit the updated value. Simultaneously restructure the scheduling section from one 3-column row into two 2-column rows. All backend data model infrastructure already exists; this is a wiring and UI change only.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 20  
**Primary Dependencies**: Express 5, MongoDB native driver (backend); React 19, TanStack Query v5, Tailwind CSS v4, ShadCN UI (frontend)  
**Storage**: MongoDB — `groups` collection, `groupMeetings` collection (no schema changes needed)  
**Testing**: Manual integration test via dev servers (see quickstart.md)  
**Target Platform**: Web (mobile-first SPA served from Express)  
**Project Type**: Full-stack web application (monorepo: `express/` + `web/`)  
**Performance Goals**: N/A — form field addition, no performance impact  
**Constraints**: TypeScript strict mode; `noUnusedLocals` enforced in frontend  
**Scale/Scope**: Single form, two API layers (service + router), two frontend layers (hook + component)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                        | Status  | Notes                                                                                                                                                                       |
| -------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript             | ✅ PASS | All new code uses typed interfaces; `notifyAttendanceHoursBefore: number` is typed throughout. No `any` added.                                                              |
| II. Layered Architecture         | ✅ PASS | Changes span Model→Service→Router (backend) and ApiType→Hook→Component (frontend). No layer violations.                                                                     |
| III. Centralized Error Handling  | ✅ PASS | No new error paths; validation errors use existing `ValidationError` patterns via `validateField`.                                                                          |
| IV. Security-First               | ✅ PASS | No authentication, file upload, or session changes. Numeric field with min-0 validation.                                                                                    |
| V. Env Config                    | ✅ PASS | No new environment variables.                                                                                                                                               |
| VI. Hook + Component Separation  | ✅ PASS | New field added to existing hook (`useGroupForm`) and component (`GroupForm`) following the established split.                                                              |
| VII. File-Based Routing          | ✅ PASS | No new routes; group edit page already exists.                                                                                                                              |
| VIII. API Client & Data Fetching | ✅ PASS | Uses existing `createGroup`/`updateGroup` functions via `useSaveGroupMutation`; no new query files needed.                                                                  |
| IX. Audit Logging                | ✅ PASS | Group save is not a sensitive security action; no audit changes needed.                                                                                                     |
| X. Date Formatting               | ✅ PASS | No date fields involved.                                                                                                                                                    |
| XI. Product Design               | ✅ PASS | Two 2-column rows follow mobile-first layout; `md:flex-row` stacks on mobile. Uses existing `Field`/`FieldGroup` composition pattern. `FieldDescription` added for context. |

**POST-DESIGN RE-CHECK**: No violations identified after Phase 1 design. All changes follow existing patterns exactly.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (files to modify)

```text
express/
├── src/
│   ├── services/
│   │   └── groupsService.ts      # GroupFormPayload, EditableGroupFormResult,
│   │                             # createManagedGroup, updateManagedGroup,
│   │                             # getManagedGroupForm
│   └── routers/
│       └── groupsRouter.ts       # POST / and PATCH /:groupId handlers

web/
└── src/
    ├── api/
    │   ├── groups.ts             # normalizeEditableGroupResponse
    │   └── types/
    │       └── groups.ts         # GroupFormDraft, EditableGroupResponse
    ├── hooks/
    │   └── useGroupForm.ts       # Fields, defaults, validation, payload
    └── components/
        └── forms/
            └── GroupForm.tsx     # Layout restructure + new input
```

**Structure Decision**: Option 2 (web application). Monorepo with `express/` backend and `web/` frontend. No new files created; all changes are additive modifications to existing files.
