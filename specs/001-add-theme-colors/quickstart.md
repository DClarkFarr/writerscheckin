# Quickstart: Implement Theme Color Scale

## Goal

Extend the base Tailwind token system so `theme` colors can be used everywhere like any existing color family.

## Steps

1. Open `web/src/index.css`.
2. In `:root`, add CSS variables for the light-theme scale:
   - `--theme-50` ... `--theme-950` (darker sky-blue family from light to dark intensity).
3. In `.dark`, add corresponding dark-mode values for the same `--theme-*` variables.
4. In `@theme inline`, map each token for Tailwind consumption:
   - `--color-theme-50: var(--theme-50);`
   - ...
   - `--color-theme-950: var(--theme-950);`
5. Ensure naming is consistent and ordered.
6. Apply `theme` tokens to at least one representative primary action and one supporting UI element.
7. Verify state differentiation (`hover`, `focus`, `active`, `disabled`) for representative controls.
8. Verify text/icon contrast on representative `theme` backgrounds.

## Migration Notes

- Replace ad-hoc sky-blue utility classes (for example, `bg-blue-600`, `hover:bg-blue-700`) with
  `theme` tokens (`bg-theme-600`, `hover:bg-theme-500`, `active:bg-theme-700`) when touching
  existing screens.
- Prefer semantic role mapping from `contracts/theme-color-tokens.md` over one-off shade choices.
- Keep legacy semantic colors (`primary`, `accent`) available during incremental migration.

## Verification Commands

Run from `web/`:

```bash
npm run lint
npm run build
```

## Manual Validation Checklist

- `bg-theme-*` classes resolve and render in the browser.
- `text-theme-*`, `border-theme-*`, and `ring-theme-*` resolve.
- UI still follows mobile-first card layout guidance.
- No regressions in non-theme components.

## Implementation Validation Log

- Representative primary action updated: `web/src/pages/home.tsx` (`Get Started` CTA).
- Representative supporting UI updated: `web/src/components/layout/Topbar.tsx` links and border.
- Representative interactive state mapping added: `web/src/components/ui/button.tsx` (`theme` variant).
- Contract role mapping and state mapping aligned in `contracts/theme-color-tokens.md`.

## Out of Scope

- Full-app migration of all legacy color usage in one pass.
- Backend API or database changes.
