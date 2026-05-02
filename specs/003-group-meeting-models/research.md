# Research: Group Meeting Models

## Decision 1: Follow Existing Model Type Hierarchy and CRUD Shape

- Decision: Use per-entity `Definition`, `Blueprint`, and `Document` types with collection accessor + `ensure...Indexes()` + CRUD functions, matching current files in `express/src/models`.
- Rationale: This preserves strict typing and consistency with current model APIs, reducing onboarding and review risk.
- Alternatives considered: A class-based repository layer was rejected because the codebase uses plain async functions per model file and keeping this pattern avoids unnecessary abstraction.

## Decision 2: Represent Recurrence as Structured Rule Data

- Decision: Store recurrence as structured fields with frequency enum (`weekly` | `biweekly`) and explicit day selectors, instead of opaque schedule strings.
- Rationale: Structured recurrence supports validation, queryability, and future extension while satisfying required weekly/biweekly behavior.
- Alternatives considered: RFC5545 RRULE strings were rejected for this phase because they add parsing complexity and dependencies beyond current scope.

## Decision 3: Enforce Time and Duration Constraints at Model Input Boundary

- Decision: Validate meeting start minutes to 15-minute increments and duration to 15-minute steps within 60-240 minutes.
- Rationale: This directly fulfills FR-003 and FR-004 and prevents invalid schedule data from being persisted.
- Alternatives considered: Deferring validation to services only was rejected because basic data-shape safety belongs in model-layer guard rails for CRUD integrity.

## Decision 4: Use Soft Delete with `deletedAt` and Default Filtering

- Decision: New entities use soft-delete semantics (`deletedAt`, plus timestamp touch) and default read filters that exclude deleted records.
- Rationale: The spec requires soft delete and default omission from standard reads while retaining audit/recovery capability.
- Alternatives considered: Hard delete was rejected because it violates requirements and removes historical traceability.

## Decision 5: Keep Attendance Logs Append-Only for Notification Jobs

- Decision: `MeetingAttendanceLog` records are immutable status-change events with `notificationSent` transitioning from false to true when downstream notification processing succeeds.
- Rationale: Append-only logs support reliable cron processing and auditability of attendance state changes.
- Alternatives considered: Mutating a single attendance event row was rejected because it weakens traceability and retry safety for notification workflows.

## Decision 6: Index for Ownership, Scheduling, and Notification Queries

- Decision: Define indexes for common lookups: active groups, members by group/role, meetings by group/time/status, attendees by meeting/member, logs by notificationSent+createdAt.
- Rationale: These access paths align with expected service operations and keep list/filter operations performant at moderate scale.
- Alternatives considered: Deferring index work was rejected because model conventions already include explicit `ensure...Indexes()` and early index planning avoids expensive migration churn later.
