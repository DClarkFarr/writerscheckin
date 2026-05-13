# Implementation Plan: Meeting Auto Publish

**Branch**: `[016-create-feature-branch]` | **Date**: 2026-05-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-meeting-auto-publish/spec.md`

## Summary

Implement scheduled auto-publishing for draft meetings by adding a cron-triggered job pipeline that composes service methods (with terminal logging only in job classes), discovers meetings whose computed publish moment (`occursAt - publishHoursBefore`) landed within the last 20 minutes, publishes each meeting once, notifies active group members (excluding canceled/removed memberships), and creates `meetingAttendees` rows with `status = invited` for each notified member.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, `cron`, `p-queue-cjs`, Nodemailer email service  
**Storage**: MongoDB (`groupMeetings`, `groupMembers`, `meetingAttendees`)  
**Testing**: `cd express && npm run build`, targeted scheduler/service smoke checks via manual invocation and log verification  
**Target Platform**: Node.js backend process in monorepo Express app  
**Project Type**: Monorepo web application backend job + service enhancement  
**Performance Goals**: Each scheduler tick should complete publish discovery + publish processing for due meetings within one minute in normal load; avoid duplicate publish operations and duplicate attendee creation  
**Constraints**: Job classes can log to terminal; service methods must return data and never write to terminal; MongoDB access remains model-only; publish flow must be idempotent for already-published or canceled meetings  
**Scale/Scope**: One recurring cron pipeline, one due-draft meeting query method, one publish-orchestrator service flow, and meeting/member/attendee side effects across existing meeting/group domains

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                           | Status | Notes                                                                                                                  |
| ----------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout     | PASS   | All new scheduler/service/model surfaces will use explicit interfaces and strict return types.                         |
| II. Layered Backend Architecture    | PASS   | Cron job classes orchestrate service calls; services orchestrate model calls; models remain sole MongoDB boundary.     |
| III. Centralized Error Handling     | PASS   | Service methods throw typed errors/return typed outcomes; job wrapper captures and logs execution-level failures.      |
| IV. Security-First Implementation   | PASS   | Publication actions remain permission-safe by using existing membership-status constraints and no broad data exposure. |
| X. Date Formatting & Time Utilities | PASS   | Date arithmetic is server-side Date math with ISO response/log fields where needed.                                    |

**Post-Design Re-Check**: PASS. Planned artifacts preserve layering, typed boundaries, and clear separation between operational logging (job) and business results (service).

## Project Structure

### Documentation (this feature)

```text
specs/016-meeting-auto-publish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── scheduled-meeting-discovery-contract.md
│   └── scheduled-meeting-publish-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── server.ts
    ├── jobs/
    │   ├── AbstractJob.ts
    │   └── PublishScheduledMeetings.ts
    ├── services/
    │   ├── QueueService.ts
    │   ├── groupMeetingsService.ts
    │   ├── groupsService.ts
    │   ├── emailService.ts
    │   └── emailTemplates/
    └── models/
        ├── groupMeetings.ts
        ├── groupMembers.ts
        └── meetingAttendees.ts
```

**Structure Decision**: Keep the implementation backend-only and compose existing meeting/group/attendee modules. Add due-meeting discovery at model/service boundaries, add publish orchestration in service methods that return structured results, and keep cron-level logging/queue behavior in job and scheduler wiring.

## Phase 0: Research

Research resolves the following implementation decisions:

1. How to compute and query due draft meetings from persisted fields without storing a separate `publishAt` column.
2. How to enforce the architecture rule: cron/job classes log, services return data only.
3. How to define active notification recipients from group membership statuses (`!= cancelled`, `!= removed`).
4. How to keep publish flow idempotent across delayed ticks and overlapping queue executions.
5. How to sequence side effects (status publish, attendee creation, email dispatch) with safe retry semantics.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): scheduled publication entities, due-window computation model, publish result envelopes.
2. [contracts/scheduled-meeting-discovery-contract.md](contracts/scheduled-meeting-discovery-contract.md): model/service contract for selecting draft meetings due in trailing 20-minute window.
3. [contracts/scheduled-meeting-publish-contract.md](contracts/scheduled-meeting-publish-contract.md): publish orchestration contract including status update, member filtering, attendee creation, and notification fan-out.
4. [quickstart.md](quickstart.md): implementation order and manual validation flow.
5. Update `.github/copilot-instructions.md` SPECKIT context pointer to this plan.

## Complexity Tracking

No constitution violations or exceptions required for this feature.
