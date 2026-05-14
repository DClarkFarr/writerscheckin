# Implementation Plan: Meeting Invite Link Status

**Branch**: `[018-improve-invite-link-behavior]` | **Date**: 2026-05-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/018-meeting-invite-link-status/spec.md`

## Summary

Replace generic forbidden invite-link failures with a status-aware invite landing experience that always shows group context, supports accept/decline for pending invites, and provides request-to-join recovery (with admin email notification) for declined/left/removed users.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query v5, Axios API client, existing email template/mailer services  
**Storage**: MongoDB (`groups`, `groupMembers`, `groupInvites`, `groupMeetings` and related membership state records)  
**Testing**: `cd express && npm run build`, `cd web && npx tsc --noEmit`, targeted manual invite-link state matrix validation  
**Target Platform**: Monorepo web app (Express API + React SPA)  
**Project Type**: Web application feature spanning backend state resolution and frontend status/action UI  
**Performance Goals**: Invite-link state resolution remains O(1) lookup semantics by `groupId + userId`; eliminate repeated retry-thrash for known authorization outcomes in this flow  
**Constraints**: MongoDB access stays in models; service layer owns status logic; query hooks own fetch/mutation behavior (no direct API calls from components); always display group name and description for non-active states  
**Scale/Scope**: One invite-link UX flow, one status-resolution contract, two pending-invite actions (accept/decline), one request-to-join email notification path

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                 |
| --------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | New status types, action payloads, and UI props remain strictly typed.                                |
| II. Layered Backend Architecture              | PASS   | Membership/invite lookups stay in models; state orchestration remains in services; routers stay thin. |
| III. Centralized Error Handling               | PASS   | Known outcomes become typed UI states; true failures still flow through existing error handling.      |
| VI. Frontend Hook + Component Separation      | PASS   | Invite-link state and actions remain in query hooks; components render from typed props.              |
| VIII. API Client & Data Fetching              | PASS   | Frontend requests remain in API/query modules with TanStack Query mutation/query usage.               |
| XI. Product Design Imperatives                | PASS   | UI updates focus on clear messaging and action affordances without changing overall product shell.    |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | Query behavior changes are scoped to hooks; no direct component-level API calls introduced.           |

**Post-Design Re-Check**: PASS. Planned artifacts preserve layering, strict typing, query-hook ownership, and explicit status/action contracts.

## Project Structure

### Documentation (this feature)

```text
specs/018-meeting-invite-link-status/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── invite-link-access-state-contract.md
│   ├── pending-invite-decision-contract.md
│   └── rejoin-request-email-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groupMembers.ts
    │   ├── groups.ts
    │   └── groupMeetings.ts
    ├── services/
    │   ├── groupMembersService.ts
    │   ├── groupMeetingsService.ts
    │   ├── groupsService.ts
    │   └── emailTemplates/
    └── routers/
        ├── groupMembersRouter.ts
        └── groupMeetingsRouter.ts

web/
└── src/
    ├── api/
    │   └── groups.ts
    ├── queries/
    │   ├── useGroupMeetingQuery.ts
    │   └── useMeetingCheckinMutation.ts
    ├── pages/
    │   └── group-meeting-view.tsx
    ├── components/
    │   └── home/
    └── hooks/
```

**Structure Decision**: Implement status resolution and transition logic in existing group membership/meeting services, then render status-aware invite-link states in the existing meeting view/query path with action mutations handled through query hooks.

## Phase 0: Research

Research resolves the following implementation decisions:

1. Canonical access-state enum and mapping strategy to replace generic forbidden UI outcomes.
2. Minimal context fields required for all non-active invite-link outcomes.
3. Accept/decline mutation transition rules and idempotency expectations.
4. Request-to-join email targeting and payload requirements for responsible admin notification.
5. Query retry behavior changes for known authorization outcomes.
6. Membership lookup strategy (`groupId + userId`) to avoid list-limit false negatives.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): invite-link state model, action transitions, and notification payload entities.
2. [contracts/invite-link-access-state-contract.md](contracts/invite-link-access-state-contract.md): backend status-resolution and response contract.
3. [contracts/pending-invite-decision-contract.md](contracts/pending-invite-decision-contract.md): accept/decline transition contract.
4. [contracts/rejoin-request-email-contract.md](contracts/rejoin-request-email-contract.md): request-to-join notification contract.
5. [quickstart.md](quickstart.md): implementation order and validation flow.
6. Update `.github/copilot-instructions.md` SPECKIT context pointer to this plan.

## Complexity Tracking

No constitution violations or exceptions required for this feature.
