# Account Menu UI Contracts

## Scope

Defines frontend interaction and UI behavior contracts for replacing the authenticated top-bar logout button with an avatar-triggered account dropdown.

## Contract 1: Authenticated Top-Bar Control

- Trigger condition: active authenticated session.
- Required behavior:
  - Render avatar trigger in top bar.
  - Do not render legacy standalone logout button concurrently.
- Accessibility:
  - Trigger must be keyboard focusable.
  - Trigger must have an accessible name (e.g., account menu label).

## Contract 2: Dropdown Structure

- Menu opens when avatar trigger is activated.
- Menu content order:
  1. Account identity section (name + email)
  2. Separator
  3. Logout action
- Menu closes on:
  - outside click
  - `Escape` key

## Contract 3: Logout Action Behavior

- Logout action MUST call existing logout flow (no endpoint contract changes).
- On success:
  - session transitions to signed out
  - existing signed-out navigation behavior is preserved
- On failure:
  - user remains authenticated
  - feedback is visible and actionable

## Contract 4: Avatar Fallback

- If avatar image source is unavailable:
  - render deterministic fallback representation from user identity data.
- Fallback must remain stable between renders for the same user identity.

## Contract 5: Extensibility

- Dropdown layout must allow insertion of additional action links without:
  - changing identity section semantics
  - changing existing logout behavior
  - reworking trigger mechanics

## Out of Scope

- New backend APIs
- Session model/schema changes
- Additional account menu links beyond logout
