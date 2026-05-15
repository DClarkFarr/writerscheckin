# Research: Control Check-In Period

**Date**: May 14, 2026  
**Feature**: Control Check-In Period  
**Research Phase**: Complete

## Decision 1: Group-Level Numeric Check-In Policy Field

**Decision**: Add `endCheckinHoursBefore` as a required non-negative integer field on group defaults.

**Rationale**: Existing domain naming already uses `*HoursBefore` (`publishHoursBefore`, `notifyAttendanceHoursBefore`), so this keeps model semantics consistent and easy to reason about.

**Alternatives considered**:

- Add boolean + fixed constant (rejected: cannot satisfy configurable admin control requirement)
- Store absolute datetime on group (rejected: group-level default must remain reusable across recurring meetings)

---

## Decision 2: Meeting Inheritance Point

**Decision**: Set meeting `endCheckinHoursBefore` at creation in `createUpcomingMeetingFromDefaults()` when copying group defaults into new meeting documents.

**Rationale**: Existing meeting defaults are already inherited there for `publishHoursBefore` and `notifyAttendanceHoursBefore`; this is the correct single source of inheritance.

**Alternatives considered**:

- Resolve from group dynamically at read time (rejected: violates requirement that meetings preserve inherited value even after group default changes)
- Backfill through async job (rejected: unnecessary operational complexity)

---

## Decision 3: Check-In Cutoff Validation on Write Path

**Decision**: Enforce cutoff in `updateMeetingCheckin()` by computing `checkinClosesAt = occursAt - endCheckinHoursBefore` and rejecting updates when `now >= checkinClosesAt`.

**Rationale**: The service is already the business-rule gate for check-in updates. Keeping this enforcement server-side prevents client bypass.

**Alternatives considered**:

- Client-side only disable (rejected: insecure and bypassable)
- Router-level validation (rejected: business logic belongs in service layer)

---

## Decision 4: Check-In Availability on Read Path

**Decision**: Update meeting-detail and feed `canCheckin` derivation to include cutoff-window validation, not only "upcoming + published".

**Rationale**: Read path must match write path so UI state and server acceptance are consistent.

**Alternatives considered**:

- Keep read path unchanged and rely on endpoint rejection (rejected: creates confusing UX mismatch)

---

## Decision 5: Time-Limit Message Formatting Rules

**Decision**: Wherever a check-in button appears, expose cutoff messaging with two formats:

- Same-day cutoff: relative countdown text (`Check-in period ends in HH MM SS`)
- Different-day cutoff: absolute date/time text (`Check-in period ends <date> at <time>`)

**Rationale**: Aligns exactly with feature requirements while preserving clarity for near-term vs later cutoffs.

**Alternatives considered**:

- Always relative format (rejected: less clear for tomorrow/later cutoffs)
- Always absolute format (rejected: poor urgency signaling for same-day cutoffs)

---

## Decision 6: Disabled-State Explanation

**Decision**: Use tooltip or equivalent inline helper text for disabled check-in controls with explicit cutoff-ended reason.

**Rationale**: Requirement explicitly asks for explanatory feedback when check-in period has passed.

**Alternatives considered**:

- Generic disabled text (rejected: does not explain cutoff cause)
- Silent disable (rejected: poor usability)

---

## Decision 7: Validation Bounds

**Decision**: Validate `endCheckinHoursBefore` as non-negative integer in models/services, matching current `assertNonNegativeInteger` behavior used by other group timing defaults.

**Rationale**: Reuses existing validation conventions and avoids introducing arbitrary new limits without product requirement.

**Alternatives considered**:

- Hard max constraint (rejected for v1: no product-defined upper bound)

---

## Summary

All prior clarifications are resolved. The implementation will add one group default field, one meeting inherited field, service-level cutoff enforcement for check-in endpoint writes, and consistent check-in cutoff messaging across all check-in UI surfaces.
