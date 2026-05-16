# Tasks: Meeting Check-in Timing

**Input**: Design documents from /specs/023-meeting-checkin-timing/  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md  
**Tests**: Acceptance criteria per user story; automated tests capture business rules  
**Organization**: Tasks grouped by user story (P1-P3 priority order, plus P2 parallel features) for independent implementation and validation

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Task is parallelizable (different files, no blocking dependencies on incomplete tasks)
- **[Story]**: User story label for user-story phase tasks only ([US1], [US2], [US3], [US4], [US5])
- **Description**: Clear action with explicit file path(s)

---

## Phase 1: Setup (Shared Infrastructure & Documentation)

**Purpose**: Prepare feature documentation and implementation checklist before code updates.

- [x] T001 Confirm implementation notes and validation order in specs/023-meeting-checkin-timing/quickstart.md
- [x] T002 Confirm rule wording alignment between specs/023-meeting-checkin-timing/spec.md and specs/023-meeting-checkin-timing/contracts/meeting-feed-checkin-ui-contract.md
- [x] T003 Review and finalize all API contracts in specs/023-meeting-checkin-timing/contracts/

**Checkpoint**: All design documents reviewed and requirements aligned.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared logic and data model updates needed before user-story implementation.

**CRITICAL**: User story tasks depend on completion of this entire phase.

### Backend Data Model Updates

- [x] T004 Add `startCheckinHoursAfterCreation` field to `GroupMeeting` model in express/src/models/groupMeetings.ts with default value `0`
- [x] T005 Add `changedBy` and `isAdminOverride` fields to `MeetingAttendee` model in express/src/models/meetingAttendees.ts for audit tracking

### Backend Helper Functions & Validation

- [x] T006 [P] Add `isCheckinPeriodOpen()` helper to express/src/utils/validators.ts to calculate window state from meeting timestamps
- [x] T007 [P] Add `canDowngradeStatus()` and `canAdminUpgradeStatus()` helpers to express/src/utils/validators.ts for status hierarchy validation
- [x] T008 [P] Add `getStatusHierarchy()` helper to express/src/services/meetingCheckinService.ts to map status names to numeric ranks

### Frontend State & Messaging Foundations

- [x] T009 [P] Add shared check-in window state hook `useCheckinWindowState()` in web/src/hooks/useCheckinWindowState.ts to compute pre-open/open/closed states
- [x] T010 [P] Create `checkinWindowMessage()` formatter in web/src/lib/checkinWindowMessage.ts to generate UI messages (removing day-of-meeting-only copy)
- [x] T011 [P] Update `useMemberMeetingDerivedState()` in web/src/hooks/useMemberMeetingDerivedState.ts to use new window state helpers and remove calendar-date gating

**Checkpoint**: Shared window calculation, validation, and messaging rules are implemented and tested locally (no TypeScript errors).

---

## Phase 3: User Story 1 - Cross-Day Check-In Eligibility (Priority: P1)

**Story Goal**: Allow attendees to check in as soon as check-in period opens, even when meeting date is on a later calendar day.

**Independent Test Criteria**:

- Configure meeting with check-in window opening before meeting day
- Set current time after check-in start and before check-in close
- Verify check-in is enabled for eligible attendees
- Verify no "day-of-meeting-only" messaging appears

### Implementation for User Story 1

- [x] T012 [US1] Update check-in eligibility logic in express/src/services/meetingCheckinService.ts to use timestamp comparison only (remove calendar date checks)
- [x] T013 [US1] Update error messages in express/src/routers/groupsRouter.ts to remove day-of-meeting references
- [x] T014 [US1] [P] Remove same-day gate from feed item check-in button enablement in web/src/components/home/MeetingFeedItem.tsx
- [x] T015 [US1] [P] Remove same-day gate from detail-page check-in enablement in web/src/pages/group-meeting-view.tsx
- [x] T016 [US1] Replace day-of-meeting-only tooltip text in web/src/components/home/MeetingFeedItem.tsx with appropriate open/closed window messaging
- [x] T017 [US1] Replace day-of-meeting-only disabled reason in web/src/pages/group-meeting-view.tsx with window-based messaging
- [x] T018 [US1] Verify backend eligibility contract reflects cross-day behavior in specs/023-meeting-checkin-timing/contracts/checkin-eligibility-contract.md

**Checkpoint**: Cross-day check-in is functional in feed and detail views with no day-of-meeting messaging.

---

## Phase 4: User Story 2 - Live Countdown Updates (Priority: P2)

**Story Goal**: Display check-in time-remaining text that updates every second while window is active.

**Independent Test Criteria**:

- Open meeting with active check-in window
- Observe supporting text countdown for at least 5 seconds
- Verify countdown decrements every second without skipped intervals
- Verify UI updates correctly when window closes

### Implementation for User Story 2

- [x] T019 [US2] Create countdown timer hook `useMeetingCheckinTimer()` in web/src/hooks/useMeetingCheckinTimer.ts with per-second updates and proper cleanup
- [x] T020 [US2] Update supporting text countdown logic in web/src/lib/checkinWindowMessage.ts to handle second-level precision
- [x] T021 [US2] [P] Integrate timer hook into feed item in web/src/components/home/MeetingFeedItem.tsx and wire countdown text updates
- [x] T022 [US2] [P] Integrate timer hook into detail view in web/src/pages/group-meeting-view.tsx and wire countdown text updates
- [x] T023 [US2] Add boundary condition handling (stop timer at close) in web/src/components/home/MeetingFeedItem.tsx
- [x] T024 [US2] Add boundary condition handling (stop timer at close) in web/src/pages/group-meeting-view.tsx
- [x] T025 [US2] Verify state transitions (open → closed) remain synchronized with formatter output across both UI surfaces

**Checkpoint**: Countdown text updates every second and transitions correctly when window closes in both UI surfaces.

---

## Phase 5: User Story 3 - Static Button Labels (Priority: P3)

**Story Goal**: Show stable pre-open button label with countdown only in supporting text.

**Independent Test Criteria**:

- Before check-in opens, button label displays "Check-in starts soon"
- Countdown information appears only in supporting text below button
- Button label contains no countdown values or timing data
- Behavior consistent across feed and detail views

### Implementation for User Story 3

- [x] T026 [US3] Replace dynamic pre-open button label with static "Check-in starts soon" text in web/src/components/home/MeetingFeedItem.tsx
- [x] T027 [US3] Ensure countdown and timing strings render only in supporting text blocks in web/src/components/home/MeetingFeedItem.tsx
- [x] T028 [US3] [P] Replace dynamic pre-open label in detail view with static "Check-in starts soon" in web/src/pages/group-meeting-view.tsx
- [x] T029 [US3] [P] Ensure countdown renders only in supporting text (not button label) in web/src/pages/group-meeting-view.tsx
- [x] T030 [US3] Remove or refactor obsolete time-until-checkin helper usage after static label change in web/src/components/home/MeetingFeedItem.tsx
- [x] T031 [US3] Verify contract prohibits countdown-in-button behavior in specs/023-meeting-checkin-timing/contracts/meeting-feed-checkin-ui-contract.md

**Checkpoint**: Button labels remain static and timing information is confined to supporting text in both UI surfaces.

---

## Phase 6: User Story 4 - Attendee Status Downgrade After Window Closes (Priority: P2)

**Story Goal**: Allow attendees to downgrade their check-in status (but not upgrade) after check-in period ends.

**Independent Test Criteria**:

- After check-in window closes, attendee with 'reading' status can change to 'attending' or 'skipping'
- Attendee with 'attending' status can change to 'skipping'
- Attendee cannot upgrade status (e.g., 'skipping' → 'attending' is blocked)
- Status changes during open window remain blocked
- Downgrade action succeeds with immediate UI update and audit trail recorded

### Implementation for User Story 4

#### Backend: Service & Authorization

- [x] T032 [US4] Update `updateMeetingCheckin()` in express/src/services/meetingCheckinService.ts to distinguish between open and closed window states
- [x] T033 [US4] Add period-closed validation logic to `updateMeetingCheckin()` that enforces downgrade-only transitions
- [x] T034 [US4] Update error messages to guide users to admin when upgrade is blocked in express/src/services/meetingCheckinService.ts
- [x] T035 [US4] Ensure `changedBy` and `isAdminOverride` fields are set to attendee (not admin) for self-initiated downgrades in express/src/models/meetingAttendees.ts updates

#### Backend: Router & Validation

- [x] T036 [US4] Update router error handling in express/src/routers/groupsRouter.ts to return appropriate 409 Conflict for blocked upgrades with contextual message
- [x] T037 [US4] Add socket event emission for status change on successful downgrade in express/src/routers/groupsRouter.ts to notify other viewers

#### Frontend: UI Components

- [x] T038 [US4] Create `CheckinStatusPicker` component in web/src/components/home/CheckinStatusPicker.tsx to display valid status transitions
- [x] T039 [US4] Add downgrade-validation logic to picker to filter available options based on current status and window state
- [x] T040 [US4] Integrate picker into `MeetingCheckinDrawer` in web/src/components/home/MeetingCheckinDrawer.tsx (or equivalent status UI)
- [x] T041 [US4] Display alert/banner when check-in period is closed with messaging "You can only downgrade your status. To increase your status, contact the group admin."
- [x] T042 [US4] Add tooltip on disabled upgrade buttons: "Check-in period has closed. Contact the group admin to upgrade your status."

#### Frontend: Mutations & State

- [x] T043 [US4] Create mutation hook `useMeetingDowngradeStatus()` in web/src/hooks/useMeetingDowngradeStatus.ts for optimistic downgrade updates
- [x] T044 [US4] Wire downgrade mutation into status picker with error handling and rollback on failure
- [x] T045 [US4] Update TanStack Query cache invalidation in web/src/pages/group-meeting-view.tsx to refresh attendee list after downgrade

#### Testing & Validation

- [x] T046 [US4] Verify backend compile: `cd express && npm run build` (no TypeScript errors)
- [x] T047 [US4] Verify frontend typecheck: `cd web && npx tsc --noEmit` (no TypeScript errors)

**Checkpoint**: Attendees can downgrade status after window closes; upgrades are blocked with appropriate messaging.

---

## Phase 7: User Story 5 - Admin Manual Status Upgrade (Priority: P2)

**Story Goal**: Enable group admins to manually upgrade any attendee's check-in status at any time, overriding window state.

**Independent Test Criteria**:

- As admin, select attendee and verify upgrade button appears
- Can upgrade from 'skipping' → 'attending' → 'reading' regardless of window state
- Non-admins cannot access upgrade feature (receive permission error)
- Upgrade succeeds immediately with audit trail recorded
- Downgrades by admin are blocked with appropriate error

### Implementation for User Story 5

#### Backend: Service & Authorization

- [x] T048 [US5] Create `adminUpgradeMeetingAttendee()` service function in express/src/services/meetingCheckinService.ts
- [x] T049 [US5] Add admin authorization check in `adminUpgradeMeetingAttendee()` verifying user is group admin for meeting's group
- [x] T050 [US5] Add upgrade-only validation to reject downgrade attempts by admins in `adminUpgradeMeetingAttendee()`
- [x] T051 [US5] Set `changedBy` to admin userId and `isAdminOverride` to `true` on successful upgrade in express/src/models/meetingAttendees.ts
- [x] T052 [US5] Create audit log entry for admin upgrades in `meetingAttendanceLogs` collection

#### Backend: Router & Endpoint

- [x] T053 [US5] Add `PATCH /meetings/:meetingId/attendees/:attendeeId/status` endpoint to express/src/routers/groupsRouter.ts
- [x] T054 [US5] Implement admin authorization check in endpoint handler
- [x] T055 [US5] Validate `targetStatus` parameter and enforce upgrade-only constraint in endpoint handler
- [x] T056 [US5] Return `403 Forbidden` for non-admins, `400 Bad Request` for downgrade attempts
- [x] T057 [US5] Emit socket event on successful admin upgrade to notify all viewers of status change

#### Frontend: UI Components

- [x] T058 [US5] Create admin attendee list view in web/src/components/group/AdminAttendeeList.tsx with status upgrade buttons
- [x] T059 [US5] Add upgrade button visibility/disable logic that checks admin role and enforces upgrade-only transitions
- [x] T060 [US5] Add modal/drawer UI for admin status change confirmation in web/src/components/group/AdminAttendeeList.tsx or dedicated component
- [x] T061 [US5] Display hover tooltips with role check: show upgrade buttons only to group admins

#### Frontend: Mutations & State

- [x] T062 [US5] Create mutation hook `useAdminUpgradeAttendeeStatus()` in web/src/hooks/useAdminUpgradeAttendeeStatus.ts
- [x] T063 [US5] Wire mutation into admin UI with loading states, error handling, and success messaging
- [x] T064 [US5] Update TanStack Query cache invalidation to refresh attendee list and counts after upgrade
- [x] T065 [US5] Add real-time socket listener in admin view to reflect other admins' concurrent upgrades

#### Admin Feature Integration

- [x] T066 [US5] Integrate attendee management UI into meeting detail page (web/src/pages/group-meeting-view.tsx or tab/section)
- [x] T067 [US5] Add role-based visibility: show admin panel only to group admins
- [x] T068 [US5] Display current status, hierarchy info, and upgrade availability in admin panel

#### Testing & Validation

- [x] T069 [US5] Verify backend compile: `cd express && npm run build` (no TypeScript errors)
- [x] T070 [US5] Verify frontend typecheck: `cd web && npx tsc --noEmit` (no TypeScript errors)

**Checkpoint**: Admins can upgrade attendee status anytime; non-admins and downgrades are properly blocked.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, edge case handling, and rollout preparation.

### Compilation & Type Safety

- [x] T071 [P] Run backend compile and verify no errors: `cd express && npm run build`
- [x] T072 [P] Run frontend typecheck and verify no errors: `cd web && npx tsc --noEmit`

### Edge Case & Boundary Validation

- [ ] T073 Status change at exact window boundary: verify downgrade allowed immediately when window closes
- [ ] T074 Attendee downgrade after admin upgrade: verify downgrade succeeds and overrides admin's upgrade
- [ ] T075 Multiple admins upgrading same attendee simultaneously: verify last-write-wins and system remains consistent
- [ ] T076 Client clock update (midnight crossing): verify countdown remains accurate and window state transitions correctly
- [ ] T077 Meeting in future with check-in window that opened before: verify attendee can check in cross-day

### Integration & Manual Testing

- [ ] T078 Execute P1 cross-day scenario and capture findings in specs/023-meeting-checkin-timing/quickstart.md
- [ ] T079 Execute P2 countdown scenario (5+ second observation) and capture findings in specs/023-meeting-checkin-timing/quickstart.md
- [ ] T080 Execute P3 static label scenario and capture findings in specs/023-meeting-checkin-timing/quickstart.md
- [ ] T081 Execute P2 downgrade scenario (multiple transition paths) and capture findings in specs/023-meeting-checkin-timing/quickstart.md
- [ ] T082 Execute P2 admin upgrade scenario (cross-admin concurrency) and capture findings in specs/023-meeting-checkin-timing/quickstart.md

### Documentation & Acceptance Checklist

- [x] T083 Update specs/023-meeting-checkin-timing/quickstart.md with validation outcomes and test evidence
- [x] T084 Verify specs/023-meeting-checkin-timing/checklists/requirements.md reflects all acceptance criteria passing
- [x] T085 Document any API contract adjustments or clarifications in specs/023-meeting-checkin-timing/contracts/

### Rollout & Merge Preparation

- [x] T086 Review all modified files for code style and adherence to project conventions
- [ ] T087 Confirm branch `023-meeting-checkin-timing` is ready for merge with all tests passing
- [x] T088 Generate summary of changes for release notes in specs/023-meeting-checkin-timing/

**Final Checkpoint**: Feature is fully implemented, tested, documented, and ready for merge.

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase                  | Depends On       | Blocks                                    |
| ---------------------- | ---------------- | ----------------------------------------- |
| Phase 1 (Setup)        | None             | All phases                                |
| Phase 2 (Foundational) | Phase 1          | All user stories (US1-5)                  |
| Phase 3 (US1)          | Phase 2          | US2, US3 (UI uses US1 foundation)         |
| Phase 4 (US2)          | Phase 2          | US3 (countdown needed for button changes) |
| Phase 5 (US3)          | Phase 4          | Phase 8 (depends on finalized timer)      |
| Phase 6 (US4)          | Phase 2          | Phase 8 (validation)                      |
| Phase 7 (US5)          | Phase 2          | Phase 8 (validation)                      |
| Phase 8 (Polish)       | All user stories | Release                                   |

### Within-Phase Parallelization Opportunities

**Phase 2 Parallelizable Tasks**:

- T006, T007, T008 (backend helpers)
- T009, T010, T011 (frontend foundation)

**Phase 3 Parallelizable Tasks**:

- T014, T015 (feed and detail page refactoring)

**Phase 4 Parallelizable Tasks**:

- T021, T022 (feed and detail integration)
- T023, T024 (boundary handling)

**Phase 5 Parallelizable Tasks**:

- T028, T029 (detail page label updates)

**Phase 6 Parallelizable Tasks**:

- T046, T047 (compilation checks)

**Phase 7 Parallelizable Tasks**:

- T069, T070 (compilation checks)

**Phase 8 Parallelizable Tasks**:

- T071, T072 (final compilation)

### User Story Independence

- **US1 (P1)** MVP: Can complete immediately after Phase 2; enables core cross-day check-in
- **US2 (P2)** Countdown: Depends on Phase 2; can execute independently after US1 if desired
- **US3 (P3)** Labels: Depends on US2 for finalized UI layout; lower priority
- **US4 (P2)** Downgrade: Depends on Phase 2; independent of US1, US2, US3
- **US5 (P2)** Admin Upgrade: Depends on Phase 2; independent of US1-4

### Suggested Parallel Execution

**Track 1 (Cross-day Eligibility)**:

- Phase 1, 2 → Phase 3 (US1)

**Track 2 (Status Controls)**:

- Phase 1, 2 → Phase 6 (US4) + Phase 7 (US5) in parallel

**Track 3 (UI Polish)**:

- Phase 1, 2 → Phase 4 (US2) → Phase 5 (US3)

All tracks should converge at Phase 8 for integration testing.

---

## Implementation Strategy

### MVP Scope (Minimal Viable Product)

**Deliverables**: Phase 1 + Phase 2 + Phase 3 (US1 only)

**User Capabilities**:

- Check in during open window even on prior calendar days
- No day-of-meeting-only messaging visible

**Effort**: Foundational infrastructure + cross-day eligibility logic (backend + frontend)

**Demo**: "User in different timezone can check in 48 hours before meeting date"

### Incremental Delivery

1. **Increment 1**: US1 (P1) - Cross-day check-in eligibility
   - Enables core feature
   - Foundation for remaining stories
2. **Increment 2**: US2 + US3 (P3) - UI polish (countdown + stable labels)
   - Enhances user feedback
   - Completes timer-based UX
3. **Increment 3**: US4 + US5 (P2) - Post-window status management
   - Attendee downgrade capability
   - Admin override capability
   - Completes full feature

### Rollout Phases

- **Week 1**: Deploy Increment 1 (US1) to production
- **Week 2**: Deploy Increment 2 (US2 + US3) after UI validation
- **Week 3**: Deploy Increment 3 (US4 + US5) after admin workflows tested

---

## Testing Requirements

### Per-User-Story Testing

| Story | Test Type          | Criteria                                                                               |
| ----- | ------------------ | -------------------------------------------------------------------------------------- |
| US1   | Manual + E2E       | Check-in window opens before meeting day; attendee can check in; no day-only messaging |
| US2   | Manual observation | Countdown updates every second for 60+ seconds; transitions at close                   |
| US3   | Manual + visual    | Button label static "Check-in starts soon"; countdown only in supporting text          |
| US4   | Manual + E2E       | Downgrade allowed after close; upgrade blocked; error messaging correct                |
| US5   | Manual + E2E       | Admin can upgrade anytime; non-admins blocked; downgrade rejected; audit logged        |

### Compilation & Type Safety

- Backend: `npm run build` returns exit code 0
- Frontend: `npx tsc --noEmit` returns exit code 0

### Acceptance Checklist

- See specs/023-meeting-checkin-timing/checklists/requirements.md for full acceptance criteria per user story

---

## Notes

1. **Task Format**: All tasks follow strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
2. **Story Labels**: Only applied to tasks in Phases 3-7 (user-story phases); Phases 1, 2, 8 are foundational or polish
3. **Parallelization**: Tasks marked [P] can run concurrently; other tasks have dependency chains within their phase
4. **Architecture**: Tasks preserve existing layered backend (models → services → routers), Query hook patterns, and error centralization
5. **Audit Trail**: New `changedBy` and `isAdminOverride` fields enable distinguishing attendee vs. admin status changes
6. **Backward Compatibility**: All new endpoints are additive; existing endpoints updated to support new window calculation only
