# Implementation Plan: Backfill Meeting Attendees

**Branch**: `024-backfill-attendees` | **Date**: May 22, 2026 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/024-backfill-attendees/spec.md`

## Summary

Ensure members can see and interact with already-published meetings after they join by backfilling missing meeting attendee rows when membership becomes accepted.

The implementation is deliberately minimal:

- add one reusable backfill routine in the backend service layer
- invoke it only from existing accepted-membership transitions
- reuse existing idempotent attendee creation (`createMeetingAttendeeIfMissing`)
- do not add new jobs, schema changes, or API shape changes

## Technical Context

**Language/Version**: TypeScript 5.9 (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query 5  
**Storage**: MongoDB collections (`groupMembers`, `groupMeetings`, `meetingAttendees`)  
**Testing**: Jest/integration tests in express, typecheck in express and web  
**Target Platform**: Web app (Express API + React SPA)  
**Project Type**: Full-stack web service (backend-focused change)  
**Performance Goals**: Membership activation remains responsive while backfilling typical group meeting counts  
**Constraints**: Preserve existing endpoint contracts and current meeting eligibility semantics  
**Scale/Scope**: Group-level backfill for eligible meetings on acceptance events

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ Principle I (Strict TypeScript): all changes remain in strict TS with existing type boundaries.  
✅ Principle II (Layered Backend): Mongo access remains in models; orchestration stays in services; routers remain thin.  
✅ Principle III (Centralized Error Handling): no new ad hoc error paths; existing service errors propagate via handleAsync.  
✅ Principle V (Session Auth): acceptance flows keep current auth/authorization requirements.  
✅ Principle VIII/XII (API + Query discipline): no API contract churn; frontend query behavior remains stable unless validation proves follow-up needed.

### Post-Design Constitution Check

✅ No violations introduced by design artifacts.  
✅ Chosen design avoids speculative logic and keeps scope to data consistency on membership activation.

## Phase 0: Research Output

Research completed in [research.md](research.md) with all clarifications resolved.

Key conclusions applied to design:

1. Backfill belongs on accepted-membership transitions, not on read paths or background jobs.
2. Existing unique constraints and `createMeetingAttendeeIfMissing` provide required idempotency.
3. Meeting eligibility must reuse current business rules rather than introducing a new rule set.

## Phase 1: Design Output

- Data model: [data-model.md](data-model.md)
- Contract: [contracts/membership-attendee-backfill-contract.md](contracts/membership-attendee-backfill-contract.md)
- QA guide: [quickstart.md](quickstart.md)

## Project Structure

### Documentation (this feature)

```text
specs/024-backfill-attendees/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── membership-attendee-backfill-contract.md
└── tasks.md                      # generated later by /speckit.tasks
```

### Source Code (repository root)

```text
express/
├── src/
│   ├── models/
│   │   ├── groupMeetings.ts
│   │   └── meetingAttendees.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── groupInvitesService.ts
│   │   ├── groupMembersService.ts
│   │   └── groupMeetingsService.ts
│   └── routers/
│       ├── authRouter.ts
│       ├── groupInvitesRouter.ts
│       └── groupsRouter.ts
└── tests/
    ├── integration/
    └── unit/

web/
└── src/
    └── queries/
        └── useMyMeetingsQuery.ts   # verify only; no planned changes by default
```

**Structure Decision**: Backend-first, event-driven backfill integrated into existing membership acceptance flows. Frontend changes are out of scope unless backend-complete verification still shows a visibility gap.

## Implementation Boundaries

To satisfy the request to avoid unnecessary logic:

- do not introduce periodic reconciliation jobs
- do not add new collections or schema fields
- do not change endpoint payloads unless absolutely required by failing tests
- do not modify My Meetings query semantics unless backend fix does not resolve the issue

## Complexity Tracking

No constitution violations or complexity exceptions identified.

## Implementation Delta Summary

Completed implementation so far:

- Added `listEligiblePublishedMeetingsForMembershipBackfill()` in `express/src/models/groupMeetings.ts`.
- Added `backfillMeetingAttendeesForAcceptedMembership()` in `express/src/services/groupMembersService.ts`.
- Wired backfill execution into accepted membership transitions in:
  - `respondToGroupInvite()`
  - `attachUserToInvitedMembers()`
  - `addGroupMember()` accepted path
  - `respondToJoinGroupInvite()`
  - `respondToMeetingInviteDecision()`

Validation completed:

- Backend: `npx tsc --noEmit` and `npm run build` pass in `express/`.
- Frontend: `npx tsc -b` passes in `web/`.

## Residual Risks

- Manual QA scenarios (invite acceptance and add-member after publication) still need execution to confirm end-to-end UI visibility in real data states.
- Behavior for historical/edge meeting sets depends on current eligibility filter semantics (`published` and not `cancelled`) and should be validated against product expectations.
- No additional frontend fallbacks were added by design; if real-user QA still finds missing items, follow-up should inspect runtime query invalidation timing and socket update sequencing.
