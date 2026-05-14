# Tasks: Meeting Invite Link Status

**Input**: Design documents from `/specs/018-meeting-invite-link-status/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests were not explicitly requested in the specification; this task list focuses on implementation and manual validation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared status/action primitives reused by backend and frontend work.

- [x] T001 Add canonical invite-link access-state constants and message key map in express/src/services/groupInvitesService.ts
- [x] T002 [P] Add frontend invite-link access state and action union types in web/src/api/types/groupInvites.ts
- [x] T003 [P] Create shared invite-link status message/action configuration in web/src/lib/inviteLinkStatusConfig.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build core cross-story contracts for state resolution, payload mapping, and retry behavior.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Implement direct groupId+userId membership/invite lookup helper in express/src/models/groupMembers.ts
- [x] T005 [P] Add responsible-admin recipient resolution helper for join requests in express/src/models/groups.ts
- [x] T006 Implement service-level resolver mapping membership records to canonical invite-link access states in express/src/services/groupInvitesService.ts
- [x] T007 Add non-active invite-link response DTO builder including groupName/groupDescription/actions in express/src/services/groupMeetingsService.ts
- [x] T008 [P] Extend meeting view API response types for invite-link context payload in web/src/api/types/groups.ts
- [x] T009 [P] Map invite-link access context in meeting view API client response handling in web/src/api/groups.ts
- [x] T010 Add invite-link query retry policy override for known authorization outcomes in web/src/queries/useMeetingViewQuery.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Status-Aware Invite Landing (Priority: P1) 🎯 MVP

**Goal**: Render status-specific invite-link guidance with group context instead of generic forbidden errors.

**Independent Test**: Open the same meeting invite link as users in pending/not-invited/declined-or-left/removed states and verify status-specific messaging plus group name/description without red forbidden fallback.

### Implementation for User Story 1

- [x] T011 [US1] Return typed non-active invite-link access payload from meeting view service flow in express/src/services/groupMeetingsService.ts
- [x] T012 [US1] Preserve semantic HTTP error handling while exposing invite-link state payloads in express/src/routers/groupsRouter.ts
- [x] T013 [US1] Ensure non-active payload mapping always includes group name and description in express/src/services/groupSummaryMapper.ts
- [x] T014 [US1] Expose invite-link access context from meeting-view query hook in web/src/queries/useMeetingViewQuery.ts
- [x] T015 [P] [US1] Create reusable invite-link status panel UI component for status messaging in web/src/components/invite/InviteLinkStatusPanel.tsx
- [x] T016 [US1] Add non-active state rendering branch in meeting view page using InviteLinkStatusPanel in web/src/pages/group-meeting-view.tsx
- [x] T017 [US1] Remove/replace generic forbidden UI path for resolved invite-link states in web/src/pages/group-meeting-view.tsx

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Accept Or Decline From Invite State (Priority: P2)

**Goal**: Let pending-invite users accept or decline directly from invite landing and transition state in-flow.

**Independent Test**: Open a pending-invite meeting link, run Accept and Decline in separate attempts, and verify resulting state transitions and UI updates without leaving the page.

### Implementation for User Story 2

- [x] T018 [US2] Implement pending-invite decision service (accept/decline) with precondition and idempotency handling in express/src/services/groupInvitesService.ts
- [x] T019 [US2] Add invite decision endpoint wiring for meeting-link flow in express/src/routers/groupInvitesRouter.ts
- [x] T020 [US2] Add invite decision request/response API method in web/src/api/groupInvites.ts
- [x] T021 [US2] Extend invite decision payload/result types for meeting-link usage in web/src/api/types/groupInvites.ts
- [x] T022 [US2] Add or adapt pending-invite decision mutation hook for meeting view in web/src/queries/useRespondToJoinInviteMutation.ts
- [x] T023 [US2] Wire Accept/Decline action handlers and loading/error states into InviteLinkStatusPanel in web/src/components/invite/InviteLinkStatusPanel.tsx
- [x] T024 [US2] Refresh meeting view query and render transitioned state after accept/decline in web/src/pages/group-meeting-view.tsx
- [x] T025 [US2] Add confirmation and failure messaging for accept/decline outcomes in web/src/pages/group-meeting-view.tsx

**Checkpoint**: User Stories 1 and 2 are independently functional.

---

## Phase 5: User Story 3 - Rejoin Request For Declined Or Removed Users (Priority: P3)

**Goal**: Provide a request-to-join recovery action that emails the responsible admin with requester and meeting/group context.

**Independent Test**: Open the meeting link as declined/removed user, click Request to join, verify success state and that admin notification contains requester email plus group/meeting context; verify explicit failure message when recipient resolution/send fails.

### Implementation for User Story 3

- [x] T026 [US3] Implement request-to-join service action gated to declined_or_left/removed states in express/src/services/groupInvitesService.ts
- [x] T027 [US3] Add join-request email template composition for requester/group/meeting context in express/src/services/emailTemplates/groupInviteEmail.ts
- [x] T028 [US3] Wire responsible-admin lookup and email dispatch into request-to-join flow in express/src/services/groupInvitesService.ts
- [x] T029 [US3] Add request-to-join endpoint for invite-link recovery in express/src/routers/groupInvitesRouter.ts
- [x] T030 [US3] Add request-to-join API client method in web/src/api/groupInvites.ts
- [x] T031 [US3] Extend request-to-join API types for success/failure outcomes in web/src/api/types/groupInvites.ts
- [x] T032 [US3] Create request-to-join mutation hook for meeting invite landing in web/src/queries/useRespondToJoinInviteMutation.ts
- [x] T033 [US3] Wire Request to join action and loading/error states in InviteLinkStatusPanel in web/src/components/invite/InviteLinkStatusPanel.tsx
- [x] T034 [US3] Render declined/removed recovery guidance and failure fallback messaging in web/src/pages/group-meeting-view.tsx

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, docs alignment, and readiness checks.

- [ ] T035 [P] Update invite-link quickstart with status matrix execution notes and outcomes in specs/018-meeting-invite-link-status/quickstart.md
- [ ] T036 Run backend compile validation command `cd express && npm run build` documented in express/package.json
- [ ] T037 Run frontend typecheck validation command `cd web && npx tsc --noEmit` documented in web/tsconfig.app.json
- [ ] T038 Execute full manual invite-link status matrix and capture pass/fail notes in specs/018-meeting-invite-link-status/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story Phases (Phase 3-5)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on US2/US3.
- **US2 (P2)**: Starts after Phase 2 and builds on US1 rendering surface for pending state actions.
- **US3 (P3)**: Starts after Phase 2 and can integrate into US1 rendering surface independently of US2 decision flow.

### Within Each User Story

- Backend service/route wiring precedes frontend mutation/UI action wiring.
- Query hook updates precede final page-level state rendering updates.
- User-facing success/failure messaging follows functional action handling.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T005, T008, and T009 can run in parallel with T004/T006/T007.
- In US1, T015 can run in parallel with backend tasks T011-T013.
- In US2, T020 and T021 can run in parallel after T019.
- In US3, T030 and T031 can run in parallel after T029.
- T035 can run in parallel with T036 and T037.

---

## Parallel Example: User Story 1

```bash
# Backend and UI shell in parallel
Task: "Return typed non-active invite-link access payload from meeting view service flow in express/src/services/groupMeetingsService.ts"
Task: "Create reusable invite-link status panel UI component for status messaging in web/src/components/invite/InviteLinkStatusPanel.tsx"
```

## Parallel Example: User Story 2

```bash
# API client and types in parallel
Task: "Add invite decision request/response API method in web/src/api/groupInvites.ts"
Task: "Extend invite decision payload/result types for meeting-link usage in web/src/api/types/groupInvites.ts"
```

## Parallel Example: User Story 3

```bash
# Request-to-join frontend integration in parallel after endpoint exists
Task: "Add request-to-join API client method in web/src/api/groupInvites.ts"
Task: "Extend request-to-join API types for success/failure outcomes in web/src/api/types/groupInvites.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate status-aware non-active invite landing behavior across state matrix.
4. Demo/deploy MVP if accepted.

### Incremental Delivery

1. Deliver US1 (status-aware landing + group context visibility).
2. Deliver US2 (pending invite accept/decline in-flow transitions).
3. Deliver US3 (rejoin request + admin email notification).
4. Run compile/typecheck/manual validation and finalize docs.

### Parallel Team Strategy

1. Backend developer: state resolution + decision/recovery service and router tasks.
2. Frontend developer A: meeting view query + status panel rendering.
3. Frontend developer B: invite decision/rejoin mutation hooks and API client/types.
4. Joint validation pass on status matrix and retry behavior.

---

## Notes

- All tasks follow required checklist format with task ID and file path.
- [P] is used only for tasks with no blocking file or sequencing dependency.
- Story labels are present only in user story phases.
- Each user story defines an independent test for validation and incremental delivery.
