# Research: Meeting Check-in Timing

**Date**: May 16, 2026  
**Feature**: Meeting Check-in Timing  
**Research Phase**: Complete

## Decision 1: Eliminate same-day UI gating for check-in availability

**Decision**: Determine check-in availability from check-in window timestamps and eligibility state, not whether current date equals meeting date.

**Rationale**: Product requirement explicitly allows check-in once the check-in period opens, including prior calendar days (for example 48-hour lead windows).

**Alternatives considered**:

- Keep same-day requirement and only change copy (rejected: does not satisfy required behavior)
- Keep same-day for feed but not detail view (rejected: inconsistent behavior and user confusion)

---

## Decision 2: Keep backend check-in close-time enforcement as source of truth

**Decision**: Preserve service-level close-window validation in `meetingCheckinService.ts` and ensure UI state reflects the same open/closed model.

**Rationale**: Server-side validation is required for authoritative enforcement and avoids trust in client clocks for final authorization.

**Alternatives considered**:

- Move all validation to frontend only (rejected: insecure and inconsistent)
- Add separate endpoint for open-window checks (rejected: unnecessary for this scope)

---

## Decision 3: Use second-level timers only while countdown is actionable

**Decision**: Run a one-second timer when check-in countdown is visible (active/open window) and stop it at close.

**Rationale**: Meets requirement for second-level updates while minimizing unnecessary rerenders and interval churn.

**Alternatives considered**:

- Recompute countdown on each render without interval (rejected: not deterministic)
- Poll backend each second (rejected: excessive network load and unnecessary complexity)

---

## Decision 4: Keep action labels static; place dynamic countdown in supporting text

**Decision**: The pre-window action button must remain a static `check-in starts soon` label; dynamic countdown appears only in the supporting text below.

**Rationale**: Separates action intent from timing context and directly matches requirement.

**Alternatives considered**:

- Embed countdown in button text (rejected: explicitly disallowed)
- Remove countdown entirely (rejected: conflicts with live countdown requirement)

---

## Decision 5: Centralize message formatting across feed and detail surfaces

**Decision**: Use shared check-in window message formatting logic so both `MeetingFeedItem` and `group-meeting-view` show consistent countdown and closed/open messaging.

**Rationale**: Prevents divergence between UI surfaces and reduces duplicate timing logic.

**Alternatives considered**:

- Separate formatting implementations per component (rejected: drift risk)
- Hard-code messages in JSX only (rejected: poor maintainability)

---

## Summary

All open questions in technical context are resolved. Implementation should remove same-day gating, keep server-side eligibility enforcement, provide second-level countdown updates during active windows, and maintain stable button labeling with countdown text in supporting copy only.
