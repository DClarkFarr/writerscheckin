# Tasks: Join Group Invite

**Input**: Design documents from /specs/015-join-group-invite/
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the baseline files and route surfaces used by all user stories.

- [x] T001 Create invite API type module in web/src/api/types/groupInvites.ts
- [x] T002 Create invite API client module in web/src/api/groupInvites.ts
- [x] T003 [P] Create public route layout in web/src/routes/\_public.tsx
- [x] T004 [P] Create join invite route file in web/src/routes/\_public/join.$membershipId.tsx
- [x] T005 Create join invite page scaffold in web/src/pages/join-group-invite.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared backend and auth-routing primitives that block all stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Add signed invite token helpers in express/src/services/groupInvitesService.ts
- [x] T007 Create group invites router scaffold in express/src/routers/groupInvitesRouter.ts
- [x] T008 Register group invites router in express/src/routers/apiRouter.ts
- [x] T009 Add public path matcher utility in web/src/lib/authPaths.ts
- [x] T010 Update auth redirect guard to use public path matcher in web/src/components/layout/RootLayout.tsx
- [x] T011 Update invite email link builder for membership + token links in express/src/services/emailTemplates/baseEmailTemplate.ts
- [x] T012 Update invite email template to emit signed join URL in express/src/services/emailTemplates/groupInviteEmail.ts
- [x] T013 Pass membership and token inputs to email template in express/src/services/groupMembersService.ts

**Checkpoint**: Shared routing, token strategy, and auth redirect handling are ready.

---

## Phase 3: User Story 1 - Open Invite From Email (Priority: P1) 🎯 MVP

**Goal**: Let invited users open the email link and view invite details while signed in or signed out.

**Independent Test**: Open a valid join link in both signed-out and signed-in sessions and verify details render with no forced login redirect.

- [x] T014 [P] [US1] Implement invite detail read service and view-state mapping in express/src/services/groupInvitesService.ts
- [x] T015 [US1] Implement GET /api/group-invites/:membershipId endpoint in express/src/routers/groupInvitesRouter.ts
- [x] T016 [P] [US1] Implement getJoinGroupInvite API function in web/src/api/groupInvites.ts
- [x] T017 [P] [US1] Implement invite detail query hook in web/src/queries/useJoinGroupInviteQuery.ts
- [x] T018 [P] [US1] Create invite details card component in web/src/components/invite/JoinGroupInviteCard.tsx
- [x] T019 [US1] Implement join page data orchestration and status states in web/src/pages/join-group-invite.tsx
- [x] T020 [US1] Add join invite route to generated route tree in web/src/routeTree.gen.ts

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Decline Invite Anywhere (Priority: P1)

**Goal**: Allow signed-in or signed-out users to decline with confirmation and updated invite status.

**Independent Test**: Decline from join page in signed-in and signed-out sessions, confirm modal behavior, and verify final declined state after refresh.

- [x] T021 [P] [US2] Implement decline action branch in invite response service in express/src/services/groupInvitesService.ts
- [x] T022 [US2] Implement POST /api/group-invites/:membershipId/respond decline handling in express/src/routers/groupInvitesRouter.ts
- [x] T023 [P] [US2] Add respondToJoinGroupInvite API function in web/src/api/groupInvites.ts
- [x] T024 [P] [US2] Create invite decline confirmation dialog component in web/src/components/invite/InviteDeclineConfirmDialog.tsx
- [x] T025 [P] [US2] Implement invite respond mutation hook for decline in web/src/queries/useRespondToJoinInviteMutation.ts
- [x] T026 [US2] Implement decline flow state management in web/src/hooks/useJoinGroupInvite.ts
- [x] T027 [US2] Wire decline modal and post-decline status refresh in web/src/pages/join-group-invite.tsx

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Accept Invite And Continue (Priority: P1)

**Goal**: Accept immediately when signed in, or open login modal and auto-accept after login when signed out.

**Independent Test**: Accept while signed in and verify redirect to /; accept while signed out, complete login in modal, and verify automatic accept + redirect to /.

- [x] T028 [US3] Implement accept authorization and ownership checks in express/src/services/groupInvitesService.ts
- [x] T029 [US3] Implement mixed-auth accept routing (accept requires session, decline remains public) in express/src/routers/groupInvitesRouter.ts
- [x] T030 [P] [US3] Create join invite login modal component in web/src/components/invite/JoinInviteLoginDialog.tsx
- [x] T031 [US3] Implement deferred accept state machine in web/src/hooks/useJoinGroupInvite.ts
- [x] T032 [US3] Integrate LoginForm-based modal and automatic accept continuation in web/src/pages/join-group-invite.tsx
- [x] T033 [US3] Add post-accept redirect and cache invalidation behavior in web/src/queries/useRespondToJoinInviteMutation.ts

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration hardening and verification across all stories.

- [x] T034 [P] Add consistent invalid/expired/handled invite copy states in web/src/components/invite/JoinGroupInviteCard.tsx
- [x] T035 [P] Refine join page error and loading states for modal/action failures in web/src/pages/join-group-invite.tsx
- [x] T036 [P] Record final manual verification outcomes in specs/015-join-group-invite/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies.
- Foundational (Phase 2): Depends on Setup completion and blocks all user stories.
- User Story phases (Phase 3-5): Depend on Foundational completion.
- Polish (Phase 6): Depends on completion of all target user stories.

### User Story Dependencies

- US1 (Phase 3): Starts after Foundational.
- US2 (Phase 4): Starts after Foundational and reuses US1 page/query structure.
- US3 (Phase 5): Starts after Foundational and reuses US1 page/query structure.

### Within Each User Story

- Backend service updates precede router endpoint wiring.
- API client and query hooks precede page wiring.
- Page orchestration follows component and hook creation.

---

## Parallel Opportunities

- Setup: T003 and T004 can run in parallel.
- Foundational: T009 can run in parallel with T006-T008; T011 and T012 can run in parallel before T013.
- US1: T016, T017, and T018 can run in parallel after T014-T015 start.
- US2: T024 and T025 can run in parallel after T021-T023 start.
- US3: T030 can run in parallel with T028-T029.
- Polish: T034, T035, and T036 can run in parallel.

---

## Parallel Example: User Story 1

- Run T016 [US1] Implement getJoinGroupInvite API function in web/src/api/groupInvites.ts
- Run T017 [US1] Implement invite detail query hook in web/src/queries/useJoinGroupInviteQuery.ts
- Run T018 [US1] Create invite details card component in web/src/components/invite/JoinGroupInviteCard.tsx

## Parallel Example: User Story 2

- Run T024 [US2] Create invite decline confirmation dialog component in web/src/components/invite/InviteDeclineConfirmDialog.tsx
- Run T025 [US2] Implement invite respond mutation hook for decline in web/src/queries/useRespondToJoinInviteMutation.ts

## Parallel Example: User Story 3

- Run T028 [US3] Implement accept authorization and ownership checks in express/src/services/groupInvitesService.ts
- Run T030 [US3] Create join invite login modal component in web/src/components/invite/JoinInviteLoginDialog.tsx

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate public invite link rendering in signed-in and signed-out sessions.
4. Demo/deploy MVP with read-only join invite experience.

### Incremental Delivery

1. Deliver US1 (view details without login requirement).
2. Deliver US2 (decline + confirmation + updated status view).
3. Deliver US3 (accept + login modal continuation + home redirect).
4. Complete polish and manual verification logging.

### Parallel Team Strategy

1. Team completes Setup and Foundational phases together.
2. Then split by story track:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3
3. Merge and finish Phase 6 polish tasks.
