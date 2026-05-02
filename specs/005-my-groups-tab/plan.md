# Implementation Plan: My Groups Tab and Group Management Flows

**Branch**: `005-create-feature-branch` | **Date**: 2026-05-02 | **Spec**: `/specs/005-my-groups-tab/spec.md`
**Input**: Feature specification from `/specs/005-my-groups-tab/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Deliver the authenticated home-page My Groups tab with infinite scrolling and actionable group cards,
plus end-to-end create/edit group workflows. Users can browse their groups, open group actions
(activate/deactivate, edit, and meeting actions), create new groups from `/groups/create`, edit groups
at `/groups/:groupId/edit`, and create upcoming meetings from group defaults with redirect to
`/groups/:groupId/meetings/:meetingId/edit`.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19 frontend, Node.js/Express 5 backend  
**Primary Dependencies**: TanStack Router (file-based), TanStack Query v5, Zustand, shadcn/ui, Tailwind CSS v4, TipTap-based rich text editor, `react-select` (multi-select search UX)  
**Storage**: MongoDB collections (`groups`, `groupMembers`, `groupMeetings`, related meeting/member models)  
**Testing**: `npm run lint` and `npm run build` in `web/`; `npm run build` in `express/`; manual authenticated flow tests for tab loading, form save, and meeting redirects  
**Target Platform**: Mobile-first SPA in modern browsers, served by same-origin Express API  
**Project Type**: Monorepo web application (`web/` + `express/`) with coordinated frontend/backend feature work  
**Performance Goals**: Initial My Groups content visible within normal home-page load; infinite-scroll page fetches append without jank; action-triggered navigations/redirects feel immediate under normal network conditions  
**Constraints**: Must preserve strict layering (models/services/routers), enforce authenticated visibility rules, keep shadcn-composed UI patterns, keep form logic in hook + presentational split, and honor canonical URL structures from spec  
**Scale/Scope**: One authenticated tab view, group create/edit form flow, participant search multi-selects, group state transitions, and upcoming-meeting creation + redirect behavior

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Planned files remain in strict TypeScript and typed API contracts.
- **II. Layered Backend Architecture**: PASS. MongoDB access remains model-only; service layer owns business rules for group/meeting actions.
- **VI. Frontend Hook + Component Separation for Forms**: PASS. Group form is planned as `useGroupForm` hook + `GroupForm` presentational component.
- **VII. File-Based Routing with TanStack Router**: PASS. Plan defines file-routed create/edit pages and canonical route paths.
- **VIII. API Client & Data Fetching**: PASS. Frontend integration will flow through `web/src/api/*` modules and TanStack Query.
- **XI. Product Design Imperatives**: PASS pending implementation checks for mobile-first spacing, clear primary CTA, and robust loading/empty/error states.
- **XII. ShadCN UI Component System**: PASS. Core UI composition uses existing shadcn components and page-level composition; external multi-select is constrained to selector behavior.

### Post-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Data model and contracts define explicit typed shapes and transitions.
- **II. Layered Backend Architecture**: PASS. Contracts separate persistence, service orchestration, and HTTP handlers.
- **VI. Frontend Hook + Component Separation for Forms**: PASS. Design artifacts specify dedicated group form hook props contract.
- **VII. File-Based Routing with TanStack Router**: PASS. Canonical URLs are mapped to explicit route-file responsibilities.
- **VIII. API Client & Data Fetching**: PASS. Contracts define API module boundaries and infinite-query pagination semantics.
- **XI. Product Design Imperatives**: PASS pending implementation QA on mobile card layout and action prominence.
- **XII. ShadCN UI Component System**: PASS. Planned component structure follows shadcn-first composition with no styling-only utility leakage.

## Project Structure

### Documentation (this feature)

```text
specs/005-my-groups-tab/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── my-groups-and-group-form-contracts.md
└── tasks.md
```

### Source Code (repository root)

```text
web/
└── src/
    ├── pages/
    │   ├── home.tsx
    │   ├── group-create.tsx                  # planned
    │   ├── group-edit.tsx                    # planned
    │   └── group-meeting-edit.tsx            # planned
    ├── routes/
    │   ├── index.tsx
    │   ├── groups/create.tsx                 # planned
    │   ├── groups/$groupId/edit.tsx          # planned
    │   └── groups/$groupId/meetings/$meetingId/edit.tsx # planned
    ├── components/
    │   ├── home/
    │   │   └── MyGroupsTab.tsx               # planned
    │   └── forms/
    │       ├── GroupForm.tsx                 # planned
    │       ├── GroupUserMultiSelect.tsx      # planned
    │       └── RichTextEditor.tsx
    ├── hooks/
    │   ├── useMyGroupsInfiniteQuery.ts       # planned
    │   └── useGroupForm.ts                   # planned
    ├── api/
    │   └── groups.ts                         # planned
    └── store/
        └── homeStore.ts

express/
└── src/
    ├── models/
    │   ├── groups.ts
    │   ├── groupMembers.ts
    │   └── groupMeetings.ts
    ├── services/
    │   ├── groupsService.ts                  # planned
    │   └── groupMeetingsService.ts           # planned
    └── routers/
        ├── apiRouter.ts
        └── groupsRouter.ts                   # planned
```

**Structure Decision**: Use the existing monorepo split and implement cross-layer support in both
`web/` and `express/`. Frontend receives tab, form, and route wiring. Backend adds group/meeting
service + router endpoints over existing group model foundations.

## Complexity Tracking

No constitution violations requiring justification are expected for this plan.
