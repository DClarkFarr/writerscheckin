# Data Model: Theme Color Scale

This feature introduces frontend design-token entities (not database entities).

## Entity: ThemeColorFamily

- Description: Named design-token family for darker-to-lighter sky-blue shades.
- Fields:
  - `name` (string): fixed identifier (`theme`)
  - `shades` (array of ThemeShadeToken): ordered token set
  - `defaultRoleMap` (RoleShadeMapping): baseline semantic mapping for UI emphasis
- Validation rules:
  - `name` must be unique among color families.
  - `shades` must contain ordered unique steps.

## Entity: ThemeShadeToken

- Description: One selectable shade in the `theme` family.
- Fields:
  - `key` (string): `theme-50` ... `theme-950`
  - `step` (number): 50..950
  - `value` (string): OKLCH color value
  - `mode` (enum): `light` or `dark` source variable
- Validation rules:
  - Each `step` is unique within `ThemeColorFamily`.
  - Lower step is perceptually lighter than higher step.
  - Token names align with Tailwind naming conventions.

## Entity: RoleShadeMapping

- Description: Semantic mapping from UI role to a specific `theme` shade token.
- Fields:
  - `highEmphasis` (ThemeShadeToken key)
  - `mediumEmphasis` (ThemeShadeToken key)
  - `lowEmphasis` (ThemeShadeToken key)
  - `interactiveStates` (object): mappings for `default`, `hover`, `focus`, `active`, `disabled`
- Validation rules:
  - Mapped keys must exist in `ThemeColorFamily`.
  - Interaction states must be visually distinct.
  - Text/icon over mapped surfaces must pass contrast requirements.

## Relationships

- `ThemeColorFamily` 1:N `ThemeShadeToken`
- `ThemeColorFamily` 1:1 `RoleShadeMapping`

## State Transitions

- Token lifecycle:
  - `defined` -> `mapped` -> `consumed`
- Migration lifecycle (per component):
  - `legacy-color` -> `theme-mapped` -> `validated`
