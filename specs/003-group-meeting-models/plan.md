# Implementation Plan: Group Meeting Models

**Branch**: `003-add-model-crud` | **Date**: 2026-05-01 | **Spec**: `/specs/003-group-meeting-models/spec.md`
**Input**: Feature specification from `/specs/003-group-meeting-models/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Define and implement new backend data structures for `Group`, `GroupMember`, `GroupMeeting`,
`MeetingAttendee`, and `MeetingAttendanceLog` with basic CRUD methods that follow existing
`express/src/models` conventions. The design uses typed model definitions/blueprints/documents,
timestamp helpers, ObjectId coercion helpers, explicit index setup, soft-delete-by-default query
behavior, and recurrence/time validation rules for scheduling.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict) on Node.js backend  
**Primary Dependencies**: Express 5, MongoDB native driver, existing model helpers in `express/src/models/types.ts`  
**Storage**: MongoDB collections in `express/src/models/collections.ts`  
**Testing**: `npm run build` in `express/`, plus manual model CRUD verification in MongoDB shell/runner scripts  
**Target Platform**: Node.js API server (`express/`) serving same-origin SPA/API  
**Project Type**: Monorepo web application (Express backend + React frontend); implementation scope is backend model layer first  
**Performance Goals**: CRUD operations for new entities complete under 1s in normal local/dev conditions; indexed lookups for recurring reads  
**Constraints**: Must follow Constitution Layer II model boundaries, use strict typing, enforce 15-minute schedule increments, preserve one-owner-per-group invariant, and default-filter soft-deleted records  
**Scale/Scope**: 5 new entity models, collection registration, index creation functions, and CRUD contract docs for downstream services/routers

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Plan uses explicit typed definitions, CRUD input types, and helper-based ObjectId/timestamp handling.
- **II. Layered Backend Architecture**: PASS. Scope is model layer only; MongoDB access remains confined to model files.
- **III. Centralized Error Handling**: PASS. Model layer uses typed/errors-as-data boundaries; router/service mapping remains unchanged.
- **IV. Security-First Implementation**: PASS. No authentication surface changes; data structures avoid secret storage and preserve auditable state transitions.
- **V. Environment Configuration via Typed Proxy**: PASS. No env access changes introduced.
- **XI. Product Design Imperatives**: PASS (N/A for this backend-focused phase).
- **XII. ShadCN UI Component System**: PASS (N/A for this backend-focused phase).

### Post-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Data model and contracts specify typed entity shapes, enums, and CRUD signatures.
- **II. Layered Backend Architecture**: PASS. Contracts keep persistence logic in `express/src/models/*` and defer business rules to services.
- **III. Centralized Error Handling**: PASS. Quickstart validation flows preserve existing error propagation architecture.
- **IV. Security-First Implementation**: PASS. Attendance logs remain immutable operational history; no sensitive-data exposure changes.
- **V. Environment Configuration via Typed Proxy**: PASS. No configuration changes required.
- **XI. Product Design Imperatives**: PASS (N/A for this backend-focused phase).
- **XII. ShadCN UI Component System**: PASS (N/A for this backend-focused phase).

## Project Structure

### Documentation (this feature)

```text
specs/003-group-meeting-models/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── group-model-crud-contracts.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── collections.ts
    │   ├── types.ts
    │   ├── groups.ts
    │   ├── groupMembers.ts
    │   ├── groupMeetings.ts
    │   ├── meetingAttendees.ts
    │   └── meetingAttendanceLogs.ts
    ├── services/
    │   └── (follow-up feature wiring)
    └── routers/
        └── (follow-up feature wiring)

specs/
└── 003-group-meeting-models/
```

**Structure Decision**: Keep the existing monorepo layout and implement this feature in the backend
model layer first, because the request is specifically to define data structures and basic CRUD
methods following current model patterns. Service/router integration and UI are explicit downstream
steps.

## Complexity Tracking

No constitution violations requiring justification are expected for this plan.
