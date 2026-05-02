# Implementation Plan: Avatar Menu Logout

**Branch**: `004-pre-spec-branch` | **Date**: 2026-05-01 | **Spec**: `/specs/004-avatar-menu-logout/spec.md`
**Input**: Feature specification from `/specs/004-avatar-menu-logout/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace the authenticated top-bar standalone logout button with a shadcn-pattern account avatar
trigger that opens a dropdown menu. The dropdown displays account identity details (name/email)
and a logout action for now, while preserving current authentication/session behavior and keeping
the menu structure extensible for future links.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19 frontend, Node.js/Express 5 backend  
**Primary Dependencies**: shadcn/ui primitives, Radix DropdownMenu, TanStack Router, TanStack Query, Zustand, Axios, Tailwind CSS v4  
**Storage**: Existing MongoDB-backed session/auth data; no schema or collection changes  
**Testing**: `npm run lint` + `npm run build` in `web/`, `npm run build` in `express/`, plus manual authenticated UI/logout flow verification  
**Target Platform**: Mobile-first SPA in modern browsers, served by existing Express backend  
**Project Type**: Monorepo web application (`web/` + `express/`) with implementation centered in frontend layout/components  
**Performance Goals**: No visible regression in top-bar render responsiveness; menu open/close and logout action feedback appear immediate to users under normal conditions  
**Constraints**: Must follow shadcn composition patterns, preserve existing logout endpoint/behavior, keep accessible keyboard dismissal, and maintain deterministic avatar fallback behavior  
**Scale/Scope**: Top-bar authenticated state, account dropdown content, and logout placement only (future links explicitly deferred)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Work remains in strict TypeScript frontend files with typed user/session state.
- **II. Layered Backend Architecture**: PASS. No backend layering changes; logout still routes through existing API/service layers.
- **VII. File-Based Routing with TanStack Router**: PASS. No route structure changes; top bar behavior is layout-level.
- **VIII. API Client & Data Fetching**: PASS. Existing auth API usage remains the single client integration path.
- **XI. Product Design Imperatives**: PASS with implementation checks. Top bar remains minimal and mobile-first with clear interaction states.
- **XII. ShadCN UI Component System**: PASS. Plan uses shadcn primitives (`Avatar`, `DropdownMenu*`) with composition-first approach.

### Post-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Data model/contracts define typed account-menu and session transitions.
- **II. Layered Backend Architecture**: PASS. Artifacts preserve backend behavior boundaries without model/service/route refactor.
- **VII. File-Based Routing with TanStack Router**: PASS. Quickstart validates behavior without route topology changes.
- **VIII. API Client & Data Fetching**: PASS. Contracts explicitly preserve existing logout API contract and error handling paths.
- **XI. Product Design Imperatives**: PASS pending implementation verification for mobile-first top bar and clear focus/active states.
- **XII. ShadCN UI Component System**: PASS. Research and contracts enforce shadcn dropdown composition and extension rules.

## Project Structure

### Documentation (this feature)

```text
specs/004-avatar-menu-logout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── account-menu-ui-contracts.md
└── tasks.md
```

### Source Code (repository root)

```text
web/
└── src/
    ├── components/
    │   ├── layout/
    │   │   └── (top bar/container component to update)
    │   └── ui/
    │       ├── avatar.tsx
    │       └── dropdown-menu.tsx
    ├── api/
    │   └── auth.ts
    ├── store/
    │   └── (auth/session state selectors)
    └── lib/
        └── (shared utilities such as initials derivation if reused)

express/
└── src/
    ├── routers/
    │   └── authRouter.ts
    └── services/
        └── authService.ts
```

**Structure Decision**: Implement this feature primarily in `web/src/components/layout/` using
existing shadcn primitives in `web/src/components/ui/`, while preserving the current auth API
integration and backend route/service behavior unchanged.

## Complexity Tracking

No constitution violations requiring justification are expected for this plan.
