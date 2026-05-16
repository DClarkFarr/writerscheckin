# Implementation Plan: Manage Group Meeting Notifications

**Branch**: `021-manage-meeting-notifications` | **Date**: May 15, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/021-manage-meeting-notifications/spec.md`

## Summary

Add a member-scoped notification preferences experience for each group, including a dedicated settings entry point from group view, a new settings page with list-item switch controls, and backend persistence using `groupMembers.unsubscribedNotifications` as a sparse object map. Empty map means subscribed to all notifications; unsubscribing sets `{ [notificationType]: true }`; subscribing removes the key.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query v5, TanStack Router, ShadCN UI (`Item`, `Switch`)  
**Storage**: MongoDB `groupMembers` collection (extend existing membership document)  
**Testing**: `cd express && npm run build`, `cd web && npx tsc --noEmit`, manual page/toggle/email-recipient checks  
**Target Platform**: Full-stack monorepo app (Express API + React SPA)  
**Project Type**: Web application feature (backend + frontend + email recipient logic)  
**Performance Goals**: Notification subscription checks stay O(1) by map key lookup; no additional round-trips per recipient beyond existing membership fetch paths  
**Constraints**: Preserve layered backend architecture; keep query-hook boundaries on frontend; no breaking changes to existing group/member contracts; maintain secure member authorization per group  
**Scale/Scope**: 1 membership schema extension, 1 settings API surface, 1 new settings route/page, and subscription-aware filtering in meeting notification send paths

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                              |
| --------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | New DTO/model fields and query hooks remain fully typed.                           |
| II. Layered Backend Architecture              | PASS   | Mongo changes limited to models; behavior in services; transport in router.        |
| III. Centralized Error Handling               | PASS   | Validation/auth failures continue through existing async/error pipeline.           |
| IV. Security-First Implementation             | PASS   | Settings endpoints require authenticated accepted membership for group.            |
| VI. Frontend Hook + Component Separation      | PASS   | New settings page uses query/mutation hooks with presentational UI composition.    |
| VII. File-Based Routing                       | PASS   | New route added under existing `groups/$groupId/*` pattern.                        |
| VIII. API Client & Data Fetching              | PASS   | API calls stay in `web/src/api/groups.ts`; components consume query wrappers.      |
| XI. Product Design Imperatives                | PASS   | Settings action near top of group page and clear scannable switch list layout.     |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | Dedicated `web/src/queries/*` wrappers own key methods and mutation cache updates. |

**Post-Design Re-Check**: PASS. Phase 1 artifacts maintain architecture boundaries and typed contracts while implementing sparse unsubscribe-map semantics.

## Project Structure

### Documentation (this feature)

```text
specs/021-manage-meeting-notifications/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── member-notification-settings-api-contract.md
│   ├── notification-delivery-evaluation-contract.md
│   └── group-notification-ui-route-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   └── groupMembers.ts
    ├── services/
    │   ├── groupMembersService.ts
    │   └── groupMeetingsService.ts
    └── routers/
        └── groupsRouter.ts

web/
└── src/
    ├── api/
    │   ├── groups.ts
    │   └── types/groups.ts
    ├── queries/
    │   ├── useGroupQuery.ts
    │   └── [new] useGroupNotificationSettingsQuery.ts
    ├── pages/
    │   ├── group-view.tsx
    │   └── [new] group-notification-settings.tsx
    ├── routes/
    │   └── groups/$groupId/
    │       └── [new] notifications.tsx
    └── components/
        └── ui/
            ├── item.tsx
            └── switch.tsx
```

**Structure Decision**: Extend existing group-member persistence and group route/query patterns rather than introducing new collections. `unsubscribedNotifications` lives on membership documents and is surfaced through member-scoped notification settings endpoints and query hooks.

## Phase 0: Research

Research completed for:

1. Sparse-object representation for unsubscribe state (`true` means unsubscribed, key missing means subscribed).
2. Safe update semantics (`set key true` for unsubscribe, `unset key` for subscribe).
3. Notification-type taxonomy aligned to current and upcoming meeting email events.
4. Recipient filtering integration points in existing publish/attendance email paths.
5. UI route and list-item/switch composition pattern matching current design system.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design outputs:

1. [data-model.md](data-model.md): membership extension, notification-type map, and toggle state transitions.
2. [contracts/member-notification-settings-api-contract.md](contracts/member-notification-settings-api-contract.md): read/update API for current member settings by group.
3. [contracts/notification-delivery-evaluation-contract.md](contracts/notification-delivery-evaluation-contract.md): send/no-send decision contract per notification type.
4. [contracts/group-notification-ui-route-contract.md](contracts/group-notification-ui-route-contract.md): route entry/navigation and rendering contract for settings page.
5. [quickstart.md](quickstart.md): implementation sequence and verification checklist.
6. Update `.github/copilot-instructions.md` SPECKIT context pointer to this plan.

## Phase 2: Task Planning Preview

Planned `/speckit.tasks` decomposition focus:

1. Extend `groupMembers` model types/normalization/update helpers for `unsubscribedNotifications`.
2. Add groups router/service endpoints for member notification settings read + patch.
3. Add reusable service helper `isUnsubscribed(membership, type)` and integrate in email recipient filtering.
4. Add frontend API types + query/mutation hooks for settings retrieval and toggle updates.
5. Add group-view entry action and new notifications page with item rows and right-aligned switches.
6. Validate persistence, authorization, optimistic UI behavior, and recipient filtering behavior.

## Complexity Tracking

No constitution violations or exemptions required.
