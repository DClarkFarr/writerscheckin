# Implementation Plan: Join Group Invite

**Branch**: `[015-add-group-invite-actions]` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-join-group-invite/spec.md`

## Summary

Implement email invite landing flow so invited users can open a public join page, review invite details, decline with confirmation while signed out, and accept invites with automatic login-modal continuation when unauthenticated; align auth redirect behavior by introducing a reusable public-route strategy that prevents `RootLayout` from forcing `/join/*` to `/login`.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Router (file-based routes), TanStack Query v5, Axios API client, ShadCN UI dialog/form components  
**Storage**: MongoDB (`groupMembers`, `groups`, `groupMeetings`) and TanStack Query in-memory cache  
**Testing**: `cd express && npm run build`, `cd web && npm run lint`, `cd web && npx tsc --noEmit`, plus manual signed-in/signed-out invite flow verification  
**Target Platform**: Same-origin Express API + React SPA in monorepo deployment  
**Project Type**: Monorepo web application (backend + frontend)  
**Performance Goals**: Join page first render and invite action roundtrips must stay within existing API interaction norms without extra fan-out beyond one invite detail query + one action mutation per user intent  
**Constraints**: Join page must be accessible without login; decline must work without login; signed-out accept must require login modal then auto-continue; protected routes must still redirect to `/login` on auth failure; router/service layering and query-hook ownership must remain intact  
**Scale/Scope**: Invite email template link generation, public invite API routes/services, join page route + modal flow, and shared auth redirect allowlist strategy for current and future unauthenticated pages

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                                 |
| --------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | New invite DTOs and route params remain strictly typed across API modules, hooks, and pages.                          |
| II. Layered Backend Architecture              | PASS   | Token validation and invite action logic remain in service/model layers; routers only parse input and send responses. |
| VI. Frontend Hook + Component Separation      | PASS   | Join page state/mutations live in hooks; modal and page sections remain presentational.                               |
| VII. File-Based Routing with TanStack Router  | PASS   | New public join route will be added through route files and page components.                                          |
| VIII. API Client & Data Fetching              | PASS   | Frontend invite reads/writes flow through `web/src/api/*` and TanStack Query hooks only.                              |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | Query keys and mutation invalidation stay owned in query hooks; no direct API calls from UI components.               |

**Post-Design Re-Check**: PASS. Design artifacts keep routing/auth decisions consistent with constitution constraints and preserve backend/frontend layering.

## Project Structure

### Documentation (this feature)

```text
specs/015-join-group-invite/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── group-invite-public-read-contract.md
│   └── group-invite-respond-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── routers/
    │   ├── apiRouter.ts
    │   └── groupInvitesRouter.ts
    ├── services/
    │   ├── groupInvitesService.ts
    │   ├── groupMembersService.ts
    │   └── emailTemplates/
    │       ├── baseEmailTemplate.ts
    │       └── groupInviteEmail.ts
    └── models/
        ├── groupMembers.ts
        ├── groups.ts
        └── groupMeetings.ts

web/
└── src/
    ├── routes/
    │   ├── __root.tsx
    │   ├── _public.tsx
    │   └── _public/
    │       └── join.$membershipId.tsx
    ├── pages/
    │   └── join-group-invite.tsx
    ├── components/
    │   └── invite/
    │       ├── JoinGroupInviteCard.tsx
    │       └── InviteDeclineConfirmDialog.tsx
    ├── hooks/
    │   └── useJoinGroupInvite.ts
    ├── queries/
    │   ├── useJoinGroupInviteQuery.ts
    │   └── useRespondToJoinInviteMutation.ts
    ├── api/
    │   ├── groupInvites.ts
    │   └── types/
    │       └── groupInvites.ts
    └── lib/
        └── authPaths.ts
```

**Structure Decision**: Introduce a dedicated group-invites API/router domain and a dedicated public route segment for unauthenticated pages so invite handling is explicit, reusable, and does not overload auth-screen or authenticated-only route trees.

## Phase 0: Research

Research decisions resolved:

1. Use signed invite links (`membershipId` + `inviteToken`) in invite email templates.
2. Add public invite read endpoint for signed-out invite page rendering.
3. Add token-backed respond endpoint where decline is public and accept requires auth.
4. Add reusable public route segment to support this and future unauthenticated pages.
5. Replace literal auth allowlist matching with path-aware `isPublicPath` helper in root layout logic.
6. Resume signed-out accept flow automatically after login modal success.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): invite access token, invite view state, action request/result, and client continuation state.
2. [contracts/group-invite-public-read-contract.md](contracts/group-invite-public-read-contract.md): public invite details endpoint contract.
3. [contracts/group-invite-respond-contract.md](contracts/group-invite-respond-contract.md): accept/decline endpoint contract with auth rules.
4. [quickstart.md](quickstart.md): step-by-step implementation and manual verification flow.
5. Update `.github/copilot-instructions.md` SPECKIT context pointer to this plan.

## Complexity Tracking

No constitution violations or exceptions required for this feature.
