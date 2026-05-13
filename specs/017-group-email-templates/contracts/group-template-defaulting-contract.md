# Contract: Group Template Defaulting on Query

## Purpose

Define backend read-path behavior that seeds missing group email template fields so frontend forms always receive editable values.

## Scope

- Layer: service + model composition for group read/query endpoints used by website flows.
- Applies to fields:
  - `publishEmailMessage`
  - `attendanceEmailMessage`

## Contract

### Input

- `groupId` (for single-group reads) or paginated group query context.
- Group document fetched from `groups` collection.

### Defaulting rules

- If `publishEmailMessage` is missing or empty string, set to seeded publish template.
- If `attendanceEmailMessage` is missing or empty string, set to `TODO: add template here`.
- If values are non-empty, preserve as-is.

### Persistence rules

- When one or both fields require defaulting, persist only those fields in `groups` document via update operation.
- No-op write when both fields already contain non-empty values.

### Output

- Returned group payload always includes non-empty values for both template fields.
- Frontend receives HTML-compatible strings suitable for rich text editors.

## Error behavior

- If persistence fails, return a typed error through existing centralized error handling.
- Partial writes are not allowed; update operation must be atomic for both fields being defaulted in that request.

## Idempotency

- Repeated reads after defaulting produce the same values and do not trigger additional writes.
