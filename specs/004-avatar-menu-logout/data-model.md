# Data Model: Avatar Menu Logout

## Overview

This feature does not add or modify persistent database entities. It introduces and clarifies frontend interaction/state entities for authenticated top-bar account menu behavior while reusing existing auth/session contracts.

## Interaction Entities

### 1) Authenticated User Summary

- Purpose: Display account identity in the top-bar avatar trigger and dropdown header.
- Key fields:
  - `displayName`
  - `email`
  - `avatarUrl` (optional)
  - `avatarFallback` (derived, deterministic)
- Validation rules:
  - `email` must be present for authenticated users.
  - `displayName` may be empty; fallback derivation still required.
  - `avatarUrl` is optional and should not block rendering when absent.

### 2) Account Menu State

- Purpose: Represents dropdown visibility and trigger context.
- Key fields:
  - `isOpen` (boolean)
  - `trigger` (avatar button element/context)
- Validation rules:
  - Menu opens only in authenticated state.
  - Menu closes on outside click and `Escape`.

### 3) Session State (Existing, Consumed)

- Purpose: Determines whether avatar menu or signed-out controls are shown.
- Key fields:
  - `isAuthenticated`
  - `user` (nullable)
- Validation rules:
  - `isAuthenticated=true` requires user summary data to render identity details.
  - Logout transition must set session to signed-out state.

### 4) Account Menu Action Item

- Purpose: Represents menu actions, currently only logout.
- Key fields:
  - `id` (e.g., `logout`)
  - `label`
  - `kind` (`default` | `destructive`)
  - `enabled`
- Validation rules:
  - Logout action must be present for authenticated users.
  - Logout action appears after identity section.

## State Transitions

### Top-Bar Auth Control

1. `Unauthenticated` -> shows signed-out controls (existing behavior)
2. `AuthenticatedLoaded` -> shows avatar trigger (logout button removed)

### Menu Interaction

1. `Closed` -> `Open` on avatar trigger activation
2. `Open` -> `Closed` on outside click or `Escape`
3. `Open` -> `SubmittingLogout` on logout selection

### Logout Flow

1. `SubmittingLogout` -> `SignedOut` when API call succeeds
2. `SubmittingLogout` -> `OpenWithError` (or clear feedback state) when API call fails; session remains authenticated

## Invariants

- Avatar trigger and legacy standalone logout button must never render simultaneously for authenticated users.
- Menu identity section is always rendered before action items.
- Feature structure supports adding non-logout action items later without changing identity rendering or logout semantics.
