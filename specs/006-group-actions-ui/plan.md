# Implementation Plan: Group Actions UI

**Branch**: `006-group-actions-ui` | **Date**: 2026-05-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/006-group-actions-ui/spec.md`

## Summary

Implement a role-based group actions interface with member-specific "Leave Group" functionality and a shared group summary view. Admin/owners see edit and manage options; members see a view button (eye icon) and leave option. The group summary modal displays name, description, recurrence, time, owner, and active member list. Backend adds a soft-delete mechanism for group membership (status + timestamp fields) and a `/api/groups/:id/leave` endpoint.

**Key deliverables**:

1. Backend: `PATCH /api/groups/:id/leave` endpoint with soft-delete via status field
2. Frontend: Group summary view/modal component (accessible via eye icon)
3. Frontend: Role-based group actions dropdown component
4. Frontend: New group detail page displaying group summary + full details

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js runtime  
**Backend**: Express 5, MongoDB (native driver), bcryptjs, Nodemailer  
**Frontend**: React 19, Vite 8, TanStack Router (file-based), TanStack Query v5, Zustand, Tailwind CSS v4, ShadCN UI  
**Storage**: MongoDB (document-based, no schema enforcement at DB level)  
**Testing**: TBD (no dedicated test runner currently in use)  
**Target Platform**: Web (mobile-first responsive design)  
**Project Type**: Web service (SPA + REST API)  
**Performance Goals**: Group summary view load <1 second (SC-006), consistent rendering across devices  
**Constraints**: Must work with up to 500 members per group without pagination (SC-006)  
**Scale/Scope**: 10k+ users, multiple groups per user, role-based access control

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **PASS** — Feature complies with all constitution principles:

1. **Strict TypeScript**: All new code will use strict mode (enabled in `tsconfig.json`).
2. **Layered Backend Architecture**:
   - Models: Modify `groupMembers.ts` to add soft-delete fields (`status`, `leftAt`); add `leaveGroup()` function
   - Services: Extend `groupsService.ts` or create `groupLeaveService.ts` to handle leave logic
   - Routers: Add `PATCH /groups/:id/leave` route in `groupsRouter.ts`
3. **Centralized Error Handling**: Leave operation will use `handleAsync()` wrapper and throw typed errors.
4. **Security-First**: Verify user is authenticated and is a member of the group before allowing leave action.
5. **Frontend Components**: Split into hook + role-specific menu components (e.g., `useGroupActions.ts` + `GroupMemberActionsDropdown.tsx` + `GroupAdminActionsDropdown.tsx`).
6. **File-Based Routing**: Group view route at `web/src/routes/groups/$groupId/view.tsx`.
7. **ShadCN Styling**: Use ShadCN components for UI; style page-level overrides in component files, not `index.css`.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

## Project Structure

### Documentation (this feature)

```text
specs/006-group-actions-ui/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code — Backend (Express monorepo layout)

```text
express/src/
├── models/
│   ├── groupMembers.ts      # ADD: status field + leftAt timestamp
│   └── groups.ts            # EXISTING
├── services/
│   └── groupsService.ts     # ADD: leaveGroup() business logic
├── routers/
│   └── groupsRouter.ts      # ADD: PATCH /groups/:id/leave route
└── utils/
    └── validators.ts        # EXISTING: reuse role validators
```

### Source Code — Frontend (React monorepo layout)

```text
web/src/
├── routes/
│   └── groups/$groupId/view.tsx  # ADD: Group view page route
├── pages/
│   └── group-view.tsx       # ADD: Page component displaying group summary + details
├── components/
│   └── group/
│       ├── GroupMemberActionsDropdown.tsx  # ADD: Member actions menu (Leave)
│       ├── GroupAdminActionsDropdown.tsx   # ADD: Admin/owner actions menu
│       ├── GroupSummaryModal.tsx        # ADD: Modal displaying group info
│       ├── GroupMembersList.tsx         # ADD: Active members list component
│       └── GroupRoleBadge.tsx           # EXISTING
├── hooks/
│   └── useGroupActions.ts   # ADD: Hook for leave group mutation + state management
└── lib/
    └── api/
        └── groups.ts        # EXISTING: may extend for leave group API call
```

**Structure Decision**: Web application (Option 2) — monorepo with separate `express/` (backend) and `web/` (frontend) projects. Backend follows Models → Services → Routers → Utils layering. Frontend uses file-based routing with TanStack Router and hook + component separation for forms/actions.

## Complexity Tracking

**No violations** — All Constitution principles are met. Feature follows established patterns:

- Backend: Extend existing layered architecture (models + services + routers)
- Frontend: Standard React hook + component pattern with TanStack Query for data fetching
- Styling: Use ShadCN components with Tailwind CSS; no special complexity

---

## Phase 0: Research & Clarification

**Prerequisites**: None (spec has no NEEDS CLARIFICATION markers)

### Research Tasks

1. **Research: Soft-delete pattern in MongoDB**  
   _Determine best practices for soft-delete in MongoDB. Compare status enum vs. boolean flag + timestamp._

2. **Research: ShadCN dropdown components**  
   _Find best ShadCN component for role-based action dropdowns. Verify iconography for view (eye), edit (pencil), leave (exit)._

3. **Research: Group member filtering patterns**  
   _Determine optimal approach for filtering active members. Consider performance with 500+ members._

4. **Research: Modal vs. page for group summary**  
   _Validate choice between modal dialog vs. dedicated route for group details. Consider mobile UX._

### Research Output

**Deliverable**: `research.md` with decisions on:

- Soft-delete implementation (status enum + `leftAt` timestamp)
- ShadCN component selection (DropdownMenu for actions, Dialog or Sheet for summary)
- Member list filtering (query-time filter vs. client-side filter)
- Summary view pattern (modal with backdrop or new route)

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete

### 1.1 Data Model (`data-model.md`)

Extract and document entities:

- **GroupMember**: Add `status` field (enum: 'active', 'left', 'removed') and `leftAt` timestamp
- **Group**: Relationship with active GroupMembers only
- **User**: Identity for group ownership and membership

### 1.2 API Contracts (`contracts/api.md`)

Define endpoints:

- **PATCH `/api/groups/:id/leave`**  
  Request: `{ userId: string }`  
  Response: `{ success: true, message: "You have left the group" }`  
  Errors: 401 (not authenticated), 403 (not a member), 404 (group not found)

- **GET `/api/groups/:id/summary`** (if needed for optimization)  
  Response: `{ id, name, description, recurrence, time, owner: User, members: User[] }`

### 1.3 Component Contracts (`contracts/ui.md`)

Define component interfaces:

- **GroupMemberActionsDropdown**: `{ group: GroupSummaryItem }`
- **GroupAdminActionsMenu**: `{ group: GroupSummaryItem; disabled?: boolean }`
- **GroupSummaryModal**: `{ groupId: string; isOpen: boolean; onClose: () => void }`
- **GroupMembersList**: `{ members: User[]; maxDisplay?: number }`

### 1.4 Quick Start (`quickstart.md`)

High-level implementation order:

1. Extend GroupMember model with soft-delete fields
2. Implement `PATCH /groups/:id/leave` endpoint
3. Create split action menus (`GroupMemberActionsDropdown` and `GroupAdminActionsMenu`) with standalone View/Edit buttons
4. Create `GroupSummaryModal` component
5. Create `group-view` route + page component
6. Update group list views to use new dropdown

---

## Implementation Ready

✅ **Constitution Check**: PASSED  
✅ **Technical Context**: Defined  
✅ **Project Structure**: Documented  
⏭️ **Next Step**: Run `/speckit.tasks` to generate actionable task list
