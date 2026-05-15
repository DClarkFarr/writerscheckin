# Contract: Group Check-In Policy Field

## Scope

Expose and persist group-level `endCheckinHoursBefore` through existing group form APIs.

## Endpoints

- `GET /api/groups/:groupId`
- `PATCH /api/groups/:groupId`
- `POST /api/groups`

## Request Contract

### Create/Patch Group Payload Additions

- `endCheckinHoursBefore: number`

Rules:

- Must be provided as a finite non-negative integer for create.
- For patch, when provided it must satisfy the same validation.
- Invalid values return validation failure.

## Response Contract

### Editable Group Response Additions

- `endCheckinHoursBefore: number`

Semantics:

- Returned value is the persisted group default used for future meeting inheritance.

## Backward Compatibility

- Existing `publicMessage` and `attendanceMessage` aliases remain unchanged.
- Existing group fields retain names and behavior.
