# Implementation Plan: Meeting View And Edit

**Branch**: `011-meeting-view-edit` | **Date**: 2026-05-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-meeting-view-edit/spec.md`

## Summary

Add breadcrumbed meeting view and meeting edit pages, expose separate backend read and admin-edit endpoints with different response shapes, let members update their own attendance from the view page, and let admins edit meetings through a debounced autosave form with toast success feedback and an explicit publish action for draft meetings.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: React 19, TanStack Router, TanStack Query v5, Axios API modules, Express 5, MongoDB native driver, dayjs date utilities, react-toastify via `web/src/utils/alert.tsx`, ShadCN breadcrumb/button/form primitives  
**Storage**: MongoDB for meetings, group memberships, meeting attendees, and meeting check-in state; TanStack Query cache in browser memory  
**Testing**: `cd express && npm run build`, `cd web && npm run build`, `cd web && npm run lint`, plus manual verification of breadcrumbs, role-based actions, attendance updates, debounced autosave, and publish flow  
**Target Platform**: Same-origin web SPA (`web/`) backed by Express API (`express/`)  
**Project Type**: Monorepo web application with backend contracts, frontend routes/pages, and query/form hooks  
**Performance Goals**: Meeting detail and edit pages render first content promptly after route transition; debounced autosave avoids per-keystroke writes while keeping edits persisted within a short pause; publish action completes in a single request and updates visible state immediately  
**Constraints**: Member-facing meeting view and admin edit endpoints must remain separate; new pages must include breadcrumbs; forms must follow Constitution hook/component separation; query wrappers must own API access and keys; autosave must debounce changes and surface toast success feedback without flooding duplicate requests; role visibility must be enforced server-side  
**Scale/Scope**: New meeting detail page, expanded meeting edit page, role-based action buttons in home and group surfaces, dedicated meeting read/edit/publish contracts, member attendance list rendering, and debounced autosave workflow for one meeting at a time

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                           | Status | Notes                                                                                                                      |
| --------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| II. Layered Backend Architecture                    | PASS   | Separate model/service/router responsibilities are preserved for new meeting detail, edit, and publish endpoints.          |
| VI. Frontend: Hook + Component Separation for Forms | PASS   | Edit flow will use a `useMeetingForm` hook plus presentational meeting form component.                                     |
| VII. File-Based Routing with TanStack Router        | PASS   | New pages live in `web/src/pages/` with one-line route files under `web/src/routes/groups/$groupId/meetings/$meetingId/*`. |
| VIII. API Client & Data Fetching                    | PASS   | New read and publish/save calls stay in `web/src/api/groups.ts` and are consumed only through query/mutation wrappers.     |
| X. Date Formatting & Time Utilities                 | PASS   | Meeting timestamps and publish timing helper text continue to use centralized date formatting utilities.                   |
| XI. Product Design Imperatives                      | PASS   | Breadcrumbed mobile-first card pages and a bright publish CTA align with the existing phone-card product chrome.           |
| XII. Frontend Query Hooks vs Direct API Calls       | PASS   | Query hooks own keys, mutations, invalidation, and optimistic check-in updates; components remain API-free.                |

**Post-Design Re-Check**: PASS. Design artifacts keep separate read/edit contracts, respect form-hook and query-hook ownership, and preserve role-gated visibility and edit permissions.

## Project Structure

### Documentation (this feature)

```text
specs/011-meeting-view-edit/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── meeting-detail-and-edit-contract.md
│   └── meeting-page-hooks-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groupMeetings.ts
    │   ├── groupMembers.ts
    │   ├── meetingAttendees.ts
    │   └── meetingCheckins.ts
    ├── services/
    │   ├── groupMeetingsService.ts
    │   └── meetingCheckinService.ts
    └── routers/
        └── groupsRouter.ts

web/
└── src/
    ├── api/
    │   ├── groups.ts
    │   └── types/groups.ts
    ├── components/
    │   ├── forms/
    │   │   └── MeetingForm.tsx
    │   ├── group/
    │   │   └── GroupMeetingsSection.tsx
    │   └── home/
    │       └── MeetingFeedItem.tsx
    ├── hooks/
    │   └── useMeetingForm.ts
    ├── pages/
    │   ├── group-meeting-edit.tsx
    │   └── group-meeting-view.tsx
    ├── queries/
    │   ├── useEditableMeetingQuery.ts
    │   ├── useMeetingViewQuery.ts
    │   ├── usePublishMeetingMutation.ts
    │   └── useSaveMeetingMutation.ts
    ├── routes/
    │   └── groups/
    │       └── $groupId/
    │           └── meetings/
    │               └── $meetingId/
    │                   ├── edit.tsx
    │                   └── view.tsx
    └── utils/
        └── alert.tsx
```

**Structure Decision**: Keep MongoDB access confined to `express/src/models`, aggregate role-aware meeting detail and edit DTOs in `express/src/services/groupMeetingsService.ts`, expose them through `groupsRouter`, and implement frontend pages as breadcrumbed `PageCard` screens backed by dedicated query hooks plus a form hook for debounced autosave.

## Phase 0: Research

Research resolves the following implementation decisions:

1. Split member-facing meeting detail and admin-edit APIs into separate endpoints and DTOs.
2. Reuse the existing `PageCard` plus breadcrumb shell for both new meeting pages.
3. Implement debounced autosave using a dedicated form hook layered over mutation/query wrappers and `alert.success(...)` feedback.
4. Build the attendee list from meeting attendees plus check-in state while preserving single-row membership authorization lookups.
5. Use a dedicated publish endpoint for draft meetings so publish is explicit and not overloaded into autosave patching.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): meeting detail, editable meeting form, participant attendance rows, and autosave/publish response objects.
2. [contracts/meeting-detail-and-edit-contract.md](contracts/meeting-detail-and-edit-contract.md): separate read, edit, publish, and quick check-in API contracts.
3. [contracts/meeting-page-hooks-contract.md](contracts/meeting-page-hooks-contract.md): route, breadcrumb, query-key, and debounced autosave hook responsibilities.
4. [quickstart.md](quickstart.md): implementation order and verification checklist.
5. Update `.github/copilot-instructions.md` plan pointer to this feature.

## Complexity Tracking

No constitution violations or exceptions are required for this feature.
