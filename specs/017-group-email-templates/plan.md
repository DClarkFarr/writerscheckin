# Implementation Plan: Group Email Templates and Check-In UX

**Branch**: `[017-create-feature-branch]` | **Date**: 2026-05-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/017-group-email-templates/spec.md`

## Summary

Implement end-to-end group and meeting email template defaults with shortcode parsing and rich text authoring, including backend default backfill on group queries, meeting-level inheritance/editability, publish-email rendering that injects a themed `[checkinButton]`, and a meeting details page check-in experience that matches the existing meeting card interaction pattern.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict)  
**Primary Dependencies**: Express 5, MongoDB native driver, React 19, TanStack Query, TipTap rich text editor, existing email template system  
**Storage**: MongoDB (`groups`, `groupMeetings`) with HTML-compatible template strings  
**Testing**: `cd express && npm run build`, `cd web && npx tsc --noEmit`, targeted manual UI and email-render smoke checks  
**Target Platform**: Monorepo web app (Express API + React SPA)  
**Project Type**: Web application feature spanning backend service/model and frontend forms/pages  
**Performance Goals**: Group query defaulting adds at most one conditional update per group lacking templates; email rendering remains O(1) per recipient for shortcode replacement  
**Constraints**: Models are the MongoDB boundary; template fields must remain HTML-compatible; default templates must not overwrite existing non-empty values; check-in UI on meeting details must reuse current meeting card behavior patterns  
**Scale/Scope**: Two template fields at group and meeting levels, one publish email renderer enhancement, and one meeting details page check-in interaction surface

## Constitution Check

**GATE RESULT (Pre-Research)**: PASS

| Principle                                     | Status | Notes                                                                                     |
| --------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| I. Strict TypeScript Throughout               | PASS   | New template parser/defaulting contracts and UI props remain strictly typed.              |
| II. Layered Backend Architecture              | PASS   | Default seeding and shortcode rendering are planned in services/models with routers thin. |
| VI. Frontend Hook + Component Separation      | PASS   | Rich text updates stay in existing hook/component boundaries.                             |
| VIII. API Client & Data Fetching              | PASS   | Query/mutation boundaries remain in existing API/query modules.                           |
| XI. Product Design Imperatives                | PASS   | Meeting details check-in pattern reuses established UX behavior.                          |
| XII. Frontend Query Hooks vs Direct API Calls | PASS   | UI uses query hooks and existing mutation hooks, no direct API calls in components.       |

**Post-Design Re-Check**: PASS. Planned artifacts preserve layering, strict typing, and current frontend architectural boundaries.

## Project Structure

### Documentation (this feature)

```text
specs/017-group-email-templates/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── group-template-defaulting-contract.md
│   ├── publish-email-rendering-contract.md
│   └── meeting-details-checkin-ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/
    ├── models/
    │   ├── groups.ts
    │   └── groupMeetings.ts
    ├── services/
    │   ├── groupsService.ts
    │   ├── groupMeetingsService.ts
    │   └── emailTemplates/
    │       ├── baseEmailTemplate.ts
    │       └── groupMeetingPublish.ts
    └── routers/
        └── groupsRouter.ts

web/
└── src/
    ├── components/
    │   ├── forms/
    │   │   ├── GroupForm.tsx
    │   │   ├── MeetingForm.tsx
    │   │   └── RichTextEditor.tsx
    │   └── home/
    │       └── MeetingFeedItem.tsx
    ├── hooks/
    │   ├── useGroupForm.ts
    │   └── useMeetingForm.ts
    ├── pages/
    │   └── group-meeting-view.tsx
    ├── queries/
    │   └── useMeetingCheckinMutation.ts
    └── api/
        ├── groups.ts
        └── types/groups.ts
```

**Structure Decision**: Keep changes in existing group/meeting backend and frontend modules. Add default-template seed logic in group query/read flows, preserve meeting inheritance in meeting creation flow, upgrade form inputs to rich text editors, and extend publish email rendering with shortcode + check-in button composition.

## Phase 0: Research

Research resolves the following implementation decisions:

1. Where to persist default template backfill so group reads can self-heal missing template fields without overwriting existing values.
2. HTML compatibility and sanitization strategy across rich text editor output and email rendering.
3. Shortcode grammar and fallback rules for `[meetingName]`, `[meetingDate]`, `[meetingTime]`, `[meetingAddress]`, `[dateOfNotification]`, and `[checkinButton]`.
4. How to inject a themed check-in button while preserving plain text email body behavior.
5. How to mirror meeting card check-in behavior on the meeting details page without introducing divergent UX states.

**Output**: [research.md](research.md)

## Phase 1: Design & Contracts

Design deliverables:

1. [data-model.md](data-model.md): group and meeting template entities, inheritance and override model, shortcode rendering inputs/outputs.
2. [contracts/group-template-defaulting-contract.md](contracts/group-template-defaulting-contract.md): backend read/default persistence contract for missing group template values.
3. [contracts/publish-email-rendering-contract.md](contracts/publish-email-rendering-contract.md): shortcode parse/render contract including HTML body and check-in CTA insertion.
4. [contracts/meeting-details-checkin-ui-contract.md](contracts/meeting-details-checkin-ui-contract.md): UI contract aligning details-page check-in controls with meeting card behavior.
5. [quickstart.md](quickstart.md): implementation order and validation flow.
6. Update `.github/copilot-instructions.md` SPECKIT context pointer to this plan.

## Complexity Tracking

No constitution violations or exceptions required for this feature.
