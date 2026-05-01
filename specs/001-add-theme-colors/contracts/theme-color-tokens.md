# Contract: Theme Color Tokens

## Purpose

Define the internal frontend contract for globally available `theme` Tailwind color tokens.

## Token Namespace

- Family name: `theme`
- Token steps: `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`

## Required Exposed Tokens

The frontend style system MUST expose the following classes for every supported color utility:

- `bg-theme-50` ... `bg-theme-950`
- `text-theme-50` ... `text-theme-950`
- `border-theme-50` ... `border-theme-950`
- `ring-theme-50` ... `ring-theme-950`
- `fill-theme-50` ... `fill-theme-950`
- `stroke-theme-50` ... `stroke-theme-950`

## Behavioral Rules

1. Dark-to-light ordering: `theme-950` is darkest, `theme-50` is lightest.
2. Tokens MUST be available globally across app routes and component modules.
3. Existing non-theme semantic colors remain valid during migration.
4. Token values MUST be defined for light and dark themes when design intent requires it.

## Semantic Usage Guidance

- High emphasis: `theme-600` to `theme-700`
- Medium emphasis: `theme-400` to `theme-500`
- Low emphasis: `theme-200` to `theme-300`
- Subtle backgrounds: `theme-50` to `theme-100`
- Critical contrast text on dark theme surfaces: use light foreground tokens or existing semantic foregrounds.

### Role-To-Shade Mapping

| UI Role                   | Preferred Token(s)         | Notes                            |
| ------------------------- | -------------------------- | -------------------------------- |
| Primary action background | `theme-600`                | Main CTA background              |
| Primary action hover      | `theme-500`                | Slightly lighter hover treatment |
| Primary action active     | `theme-700`                | Slightly darker pressed state    |
| Supporting action text    | `theme-100` to `theme-200` | On dark surfaces                 |
| Supporting surface border | `theme-800` to `theme-900` | Subtle structural separation     |
| Hero/background surface   | `theme-950`                | Darkest anchor surface           |

### Interactive State Mapping (Representative)

For controls using the `theme` family:

- `default`: `bg-theme-600 text-theme-50`
- `hover`: `bg-theme-500 text-theme-50`
- `focus`: `ring-theme-300/40` with visible focus ring
- `active`: `bg-theme-700 text-theme-50`
- `disabled`: `bg-theme-800 text-theme-300`

## Validation Requirements

- Interactive states (`default`, `hover`, `focus`, `active`, `disabled`) using `theme` must be visually distinct.
- Text/icon pairings on `theme` backgrounds must pass accessibility contrast checks.
- No component should require one-off hex/oklch literals once a suitable `theme` token exists.
