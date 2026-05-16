# Research: Manage Group Meeting Notifications

**Date**: May 15, 2026  
**Feature**: Manage Group Meeting Notifications  
**Research Phase**: Complete

## Decision 1: Store Preferences on Group Membership

**Decision**: Add `unsubscribedNotifications` to each `groupMembers` document as the canonical storage location.

**Rationale**: Preferences are explicitly per-user and per-group, and `groupMembers` already models that relationship and is available in meeting email recipient pipelines.

**Alternatives considered**:

- Add a standalone `notificationPreferences` collection (rejected: unnecessary join and index complexity for simple per-membership flags)
- Store in user profile with group map (rejected: duplicates membership scoping and complicates authorization)

---

## Decision 2: Sparse Object With Truthy Unsubscribe Flags

**Decision**: Represent state as sparse map: `unsubscribedNotifications: { [notificationType]: true }`.

**Rationale**: Matches requested semantics and provides efficient default behavior: empty object means "subscribed to all" with no migration backfill required.

**Alternatives considered**:

- Full boolean object with subscribed flags (rejected: verbose payloads and requires explicit default writes)
- Array of unsubscribed types (rejected: less explicit than keyed map and more awkward for typed partial updates)

---

## Decision 3: Toggle Semantics Use `$set`/`$unset`

**Decision**: Unsubscribe writes key as `true`; subscribe removes key.

**Rationale**: Keeps object minimal and preserves exact intent. Presence + truthy value is sufficient to detect unsubscribe state.

**Alternatives considered**:

- Set `false` when subscribed (rejected: breaks sparse-default model and retains noisy keys)
- Replace full object on each toggle (rejected: higher race risk for concurrent switch updates)

---

## Decision 4: Constrain Notification Type Keys

**Decision**: Use a fixed typed key set:

- `newMeetingPublication`
- `newMeetingCheckin`
- `meetingAttendance`
- `meetingAttendanceUpdates`

**Rationale**: Required for validation, API predictability, and deterministic filtering across backend and frontend.

**Alternatives considered**:

- Arbitrary string keys (rejected: brittle and unsafe for long-term contract evolution)

---

## Decision 5: Member-Scoped API Surface

**Decision**: Add member-self endpoints under groups context:

- `GET /api/groups/:groupId/notifications/me`
- `PATCH /api/groups/:groupId/notifications/me`

**Rationale**: Group context is already present, authorization can reuse accepted-membership checks, and this avoids exposing other members' preferences.

**Alternatives considered**:

- Put settings under user profile endpoints (rejected: loses direct group path context)
- Bulk update via group edit form endpoint (rejected: wrong ownership and permission model)

---

## Decision 6: Delivery Filtering by Membership Preference

**Decision**: Before sending each notification category email, evaluate `Boolean(membership.unsubscribedNotifications?.[type])`; send only when false.

**Rationale**: Enforces unsubscribe state at delivery time using existing recipient membership data fetches.

**Alternatives considered**:

- Filter only at UI layer (rejected: cannot enforce suppression server-side)
- Precompute recipients in separate job table (rejected: unnecessary complexity for current scale)

---

## Decision 7: UI Composition Pattern

**Decision**: Use dedicated settings page with `Item` rows (`ItemTitle`, `ItemDescription`, `ItemActions`) and right-aligned `Switch` controls.

**Rationale**: Matches design requirement and aligns with existing component inventory in constitution.

**Alternatives considered**:

- Reuse group edit form for member toggles (rejected: mixes admin defaults with member preferences)
- Inline switch block on group detail page (rejected: user asked for separate page)

---

## Summary

All implementation clarifications are resolved, including explicit sparse-object semantics for subscribe/unsubscribe behavior and where that logic must be enforced in read, write, and email-delivery paths.
