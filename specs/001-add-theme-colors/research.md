# Research: Theme Color Scale

## Decision 1: Extend tokens in `web/src/index.css` via Tailwind v4 `@theme inline`

- Decision: Add `--theme-*` CSS variables in `:root` and `.dark`, then expose them as Tailwind color tokens through `@theme inline` mappings (`--color-theme-*`).
- Rationale: The project already uses Tailwind v4 token-driven theming in `web/src/index.css` with `@theme inline`. Extending the same pattern keeps usage global and consistent with existing ShadCN component styles.
- Alternatives considered:
  - Add legacy `tailwind.config.ts` colors: rejected because this project intentionally uses Tailwind v4 CSS-based token definitions and has no separate Tailwind config file.
  - Define per-component hardcoded color classes: rejected because it breaks consistency and violates design-system reuse principles.

## Decision 2: Provide a multi-step darker-to-lighter sky-blue scale

- Decision: Define at least 10 ordered shades (`theme-50` through `theme-950`) where 950 is the darkest and 50 is the lightest.
- Rationale: A full stepped scale supports hierarchy for surfaces, borders, text emphasis, and interaction states without introducing ad-hoc one-off colors.
- Alternatives considered:
  - Minimal 3-step scale: rejected because it limits nuance for hover/focus/active state differentiation.
  - Continuous color calculations at runtime: rejected due to complexity and lower maintainability.

## Decision 3: Keep semantic role mapping explicit and centralized

- Decision: Add documented role guidance mapping to `theme` shades (high/medium/low emphasis) and preserve existing semantic colors (`primary`, `accent`, etc.) while enabling migration.
- Rationale: This allows incremental adoption without regressions and creates predictable usage expectations across teams.
- Alternatives considered:
  - Immediate global swap of existing colors to `theme`: rejected due to regression risk and difficult review scope.
  - No role mapping, only raw shades: rejected because teams would choose inconsistent shades.

## Decision 4: Validate through representative UI state checks

- Decision: Verify default/hover/focus/active/disabled states and text/icon contrast on representative controls using `theme` tokens.
- Rationale: The constitution requires obvious interactive states and accessible colors. Token correctness alone is insufficient without visual behavior checks.
- Alternatives considered:
  - Build-only validation: rejected because CSS tokens can compile while failing practical readability/state clarity.
  - Snapshot-only visual tests: deferred; useful later but not required for initial implementation planning.
