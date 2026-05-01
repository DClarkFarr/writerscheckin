# Implementation Plan: Theme Color Scale

**Branch**: `001-add-theme-colors` | **Date**: 2026-04-30 | **Spec**: `/specs/001-add-theme-colors/spec.md`
**Input**: Feature specification from `/specs/001-add-theme-colors/spec.md`

## Summary

Add a global `theme` color family to the frontend Tailwind v4 design tokens so it can be used
everywhere like existing semantic colors. The implementation extends the CSS-variable token layer
in `web/src/index.css`, defines a darker-to-lighter sky-blue shade scale, and exposes semantic
role mappings so components can adopt `theme` consistently for primary actions and emphasis states.

Finalized migration/state guidance for this feature:

- Primary actions: `bg-theme-600`, `hover:bg-theme-500`, `active:bg-theme-700`
- Focus treatment: visible ring using `ring-theme-300/40` (or stronger when required)
- Disabled treatment: `bg-theme-800` with reduced contrast text such as `text-theme-300`
- Supporting text/surfaces on dark background: `text-theme-100` to `text-theme-200`,
  `border-theme-800` to `border-theme-900`

## Technical Context

**Language/Version**: TypeScript 5.9 + CSS (Tailwind CSS v4 token system)  
**Primary Dependencies**: `tailwindcss@4`, `@tailwindcss/vite`, `shadcn` (radix-mira style), `tw-animate-css`  
**Storage**: N/A (frontend styling tokens only)  
**Testing**: Existing frontend lint/build checks (`npm run lint`, `npm run build`) + manual visual verification checklist  
**Target Platform**: Modern browsers running the Vite React SPA (mobile-first, desktop constrained card layout)  
**Project Type**: Web application (frontend-only change)  
**Performance Goals**: Zero measurable runtime regression; no additional JS bundles for color system change  
**Constraints**: Must remain compatible with current ShadCN component system and Tailwind v4 `@theme inline` pattern; preserve accessibility contrast for text/icons on `theme` surfaces  
**Scale/Scope**: Add shared tokens and role mapping in `web/src/index.css`, then validate representative component usage paths

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. Primary changes are CSS tokens and optional class usage; no type-safety regressions expected.
- **XI. Product Design Imperatives**: PASS with guardrails. Theme scale will enforce bright/dark sky-blue hierarchy while keeping UI clean and low-clutter.
- **XII. ShadCN UI Component System**: PASS. Plan extends shared tokens used by existing ShadCN-based components; no raw ad-hoc color system.
- **Accessibility requirements in Constitution**: PASS with explicit validation tasks for contrast and interactive state distinction.

### Post-Design Gate Review

- **I. Strict TypeScript Throughout**: PASS. No language-level deviations introduced.
- **XI. Product Design Imperatives**: PASS. Theme tokens support minimal, consistent, mobile-first emphasis patterns.
- **XII. ShadCN UI Component System**: PASS. Tokens are provided centrally and consumed through existing component primitives.
- **Accessibility requirements in Constitution**: PASS pending implementation verification in tasks (contrast + state differentiation checks).

## Project Structure

### Documentation (this feature)

```text
specs/001-add-theme-colors/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── theme-color-tokens.md
└── tasks.md
```

### Source Code (repository root)

```text
express/
└── src/

web/
├── src/
│   ├── index.css                # Tailwind v4 token + @theme inline mappings
│   ├── components/
│   │   └── ui/                  # ShadCN component primitives consuming semantic colors
│   ├── pages/
│   └── styles/
├── package.json
└── vite.config.ts
```

**Structure Decision**: Keep current monorepo split. This feature is frontend-only and centered
on `web/src/index.css` token extension; no backend or new package structure required.

## Complexity Tracking

No constitution violations or complexity exemptions are required.
