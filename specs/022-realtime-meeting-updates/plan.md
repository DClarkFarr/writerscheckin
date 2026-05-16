# Implementation Plan: Real-time Meeting Updates

**Branch**: `022-manage-meeting-notifications` | **Date**: May 16, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/022-realtime-meeting-updates/spec.md`

## Summary

Introduce a new realtime `meeting` socket event that emits recipient-scoped meeting update packages to group-room sockets. The event payload will contain normalized documents (`groupMeeting`, `groupMember`, `meetingAttendee`) instead of aggregated meeting feed rows. Backend emission follows the existing `socketGroupEmitGroupSummaryItem` room pattern, and frontend integration starts in `useMyMeetingsQuery` by mapping payloads into `MemberMeetingFeedItem` and upserting query cache.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, Socket.IO (server), React 19, TanStack Query v5, Socket.IO client  
**Storage**: MongoDB (`groupMeetings`, `groupMembers`, `meetingAttendees`)  
**Testing**: `cd express && npm run build`, `cd web && npx tsc --noEmit`, manual multi-user socket verification  
**Target Platform**: Monorepo web app (Express API + React SPA)  
**Project Type**: Realtime web application feature (backend + frontend)  
**Performance Goals**: Eligible sockets receive meeting update within 2 seconds; no full-feed refetch required for standard update path  
**Constraints**: Keep layered backend boundaries; preserve TanStack Query ownership in query modules; do not leak per-user membership/attendee data across recipients  
**Scale/Scope**: 1 new socket emitter path, 1 new socket payload contract, 1 frontend query-cache realtime integration path, and meeting mutation trigger wiring

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                                               |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | New payload/document types remain fully typed across express and web layers.                                        |
| II. Layered Backend Architecture              | PASS   | Data lookups remain in models; emission orchestration in services; route triggers in routers.                       |
| III. Centralized Error Handling               | PASS   | Emitter follows safe-skip pattern for recipient failures; route handlers stay inside existing async error pipeline. |
| IV. Security-First Implementation             | PASS   | Recipient scoping uses authenticated socket user ID and membership checks before emission.                          |
| VII. File-Based Routing                       | PASS   | No new route tree changes required for this feature.                                                                |
| VIII. API Client & Data Fetching              | PASS   | Existing REST contracts unchanged; realtime path is additive via socket payload contract.                           |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | Realtime cache write helpers are planned inside `useMyMeetingsQuery` and consumed by socket hook.                   |

**Post-Design Re-Check**: PASS. Phase 1 artifacts preserve architecture, per-user scoping, and query-module ownership boundaries.

## Project Structure

### Documentation (this feature)

```text
specs/022-realtime-meeting-updates/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── meeting-realtime-socket-contract.md
│   └── my-meetings-query-realtime-mapping-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groupMembers.ts
    │   ├── groupMeetings.ts
    │   └── meetingAttendees.ts
    ├── services/
    │   ├── socketEventsService.ts
    │   ├── groupMeetingsService.ts
    │   └── meetingCheckinService.ts
    └── routers/
        └── groupsRouter.ts

web/
└── src/
    ├── api/
    │   └── types/groups.ts
    ├── hooks/
    │   └── useSubscribeSocketToGroups.ts
    ├── queries/
    │   └── useMyMeetingsQuery.ts
    └── components/home/
        └── MyMeetingsTab.tsx
```

**Structure Decision**: Keep existing socket subscription hook and backend event service pattern. Implement meeting realtime emission in express service/router flow and start frontend ingestion at `useMyMeetingsQuery` to preserve query ownership and cache consistency.

## Phase 0: Research

Research completed for:

1. Room-level socket lookup reuse strategy from existing group emitter.
2. Normalized document payload contract (`groupMeeting`, `groupMember`, `meetingAttendee`) for socket events.
3. Recipient-scoped gating rules that require both membership and attendee records.
4. Query-module-owned realtime cache mapping and upsert strategy for `useMyMeetingsQuery`.
5. Trigger-point coverage across meeting-changing operations.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design outputs:

1. [data-model.md](data-model.md): socket payload entities, field invariants, and emission eligibility state transitions.
2. [contracts/meeting-realtime-socket-contract.md](contracts/meeting-realtime-socket-contract.md): event name, payload shape, recipient gating, and non-emission rules.
3. [contracts/my-meetings-query-realtime-mapping-contract.md](contracts/my-meetings-query-realtime-mapping-contract.md): frontend mapping/upsert behavior owned by `useMyMeetingsQuery`.
4. [quickstart.md](quickstart.md): ordered implementation and verification checklist, beginning with `useMyMeetingsQuery` integration.
5. Agent context update in `.github/copilot-instructions.md` to reference this plan.

## Phase 2: Task Planning Preview

Planned `/speckit.tasks` decomposition focus:

1. Add meeting socket response/document types in express service/model mapping.
2. Implement `socketGroupEmitMeetingItem({ groupId, meetingId })` in `socketEventsService.ts` using room socket enumeration.
3. For each socket user, resolve membership and attendee; skip user if either is missing.
4. Emit `meeting` event payload with normalized docs to socket-specific targets.
5. Wire emitter invocation into meeting-changing route/service flows (check-in, publish, cancel, edit/save).
6. Extend frontend socket type definitions and `useMyMeetingsQuery` with mapper + cache upsert helpers.
7. Update group socket subscription hook to process `meeting` events via query-owned helpers.
8. Validate multi-user room behavior, recipient scoping, and live My Meetings UI updates.

## Complexity Tracking

No constitution violations or exemptions required.
