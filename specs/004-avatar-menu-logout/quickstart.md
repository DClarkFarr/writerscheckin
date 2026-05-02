# Quickstart: Avatar Menu Logout

## Goal

Implement a shadcn-pattern account avatar dropdown in the authenticated top bar, replacing the standalone logout button while preserving existing logout/session behavior.

## Prerequisites

- Branch: `004-pre-spec-branch`
- Dependencies installed for `web/` and `express/`
- Existing auth flow operational locally

## Implementation Steps

1. Locate top-bar authenticated action rendering

- Identify the component rendering the current authenticated logout control in `web/src/components/layout/`.
- Confirm current auth state source and logout handler integration path.

2. Replace standalone logout control with avatar dropdown trigger

- Use shadcn primitives:
  - `Avatar` for trigger representation
  - `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent` for menu
  - `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuItem` for sections/actions
- Ensure trigger has accessible label and visible focus state.

3. Render identity section + logout action

- At top of menu, render display name and email.
- Place logout item after identity section and separator.
- Keep structure extensible so additional account links can be inserted later.

4. Preserve logout behavior

- Reuse existing logout action/API call and post-logout navigation.
- Ensure session state transitions to signed out on success.
- Handle logout failure with clear feedback while retaining authenticated state.

5. Add deterministic avatar fallback

- If avatar image URL is missing, render deterministic fallback initials from available identity fields.
- Ensure fallback is stable and visible.

## Validation Checklist

### Static checks

- `cd web && npm run lint`
- `cd web && npm run build`
- `cd express && npm run build`

### Runtime checks

1. Authenticated top-bar rendering

- Login and verify avatar trigger appears.
- Verify old standalone logout button is not shown.

2. Dropdown interactions

- Open menu via trigger click.
- Confirm identity details render at top.
- Press `Escape` to close.
- Click outside to close.

3. Logout flow

- Select Logout from menu.
- Verify session invalidates and user transitions to signed-out state.
- Verify protected pages require re-authentication.

4. Edge behavior

- Validate fallback avatar when image is absent.
- Simulate temporary logout failure and verify clear feedback with session preserved.

## Completion Criteria

- FR-001 through FR-010 are satisfied.
- SC-001 through SC-004 can be demonstrated with the validation checks above.

## Validation Results (2026-05-02)

- `cd web && npm run lint`
  - Result: Failed due to existing unrelated `react-refresh/only-export-components` issues in:
    - `web/src/components/ui/badge.tsx`
    - `web/src/components/ui/button-group.tsx`
    - `web/src/components/ui/button.tsx`
    - `web/src/components/ui/input.tsx`
    - `web/src/components/ui/toggle.tsx`
  - Feature impact: No lint errors were reported in the new/updated avatar menu files.

- `cd web && npm run build`
  - Result: Failed due to existing unrelated compile errors in `web/src/components/forms/RichTextEditor.tsx` (missing `ButtonGroup`/`Button` symbols) and `web/src/components/helpers/Portal.tsx` (missing exported `PortalWrapperId` type).
  - Feature impact: No compile errors were reported in new/updated avatar menu files.

- `cd express && npm run build`
  - Result: Passed.

### Runtime Verification Notes

- Automated runtime verification was not executed in this step.
- Manual checks to run next: authenticated avatar visibility, dropdown open/close via click + Escape/outside click, and logout success/error handling.
