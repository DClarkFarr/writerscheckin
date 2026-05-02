# Research: Group Actions UI

**Created**: 2026-05-02  
**Feature**: [Group Actions UI](../spec.md)

## Research Task 1: Soft-Delete Pattern in MongoDB

### Decision

**Use status enum + `leftAt` timestamp**

### Rationale

- Maintains full audit trail of when user left the group
- Allows future features (e.g., rejoin within grace period, view group history)
- Status enum (`'active' | 'left' | 'removed'`) is more explicit than boolean flag
- Query filtering is consistent: `{ status: 'active' }` is self-documenting

### Implementation

```javascript
// groupMembers model will have:
{
  _id: ObjectId,
  groupId: ObjectId,
  userId: ObjectId,
  role: 'owner' | 'admin' | 'member',
  status: 'active' | 'left' | 'removed',  // NEW
  leftAt: Date | null,                     // NEW
  createdAt: Date,
  updatedAt: Date
}
```

### Alternatives Considered

- **Boolean deleted flag**: Simpler but loses context (why left vs. removed?), no timestamp
- **Hard delete**: Violates audit trail needs, breaks historical data
- ✅ **Status enum + timestamp**: Best balance of clarity, audit trail, and future extensibility

---

## Research Task 2: ShadCN Dropdown Components

### Decision

**Use `DropdownMenu` component for role-based actions**

### Rationale

- ShadCN's `DropdownMenu` is built on Radix and supports nested trigger + content pattern
- Supports icons natively (eye for View, pencil for Edit, log-out for Leave)
- Mobile-friendly with touch support out-of-the-box
- Matches existing UI patterns in Writers CheckIn

### Implementation

```tsx
// Icons from lucide-react:
- View: Eye icon
- Edit: Pencil/Edit icon
- Leave: LogOut or ArrowRightFromBracket icon
- Deactivate: Ban or Trash icon (for admins)
```

### Alternatives Considered

- **Button group**: Would be cluttered with 3-4 buttons; not mobile-friendly
- **Context menu**: Right-click only; less discoverable
- ✅ **Dropdown menu**: Scalable, icon-friendly, discoverable

---

## Research Task 3: Group Member Filtering Patterns

### Decision

**Filter active members at query time (MongoDB level) for performance**

### Rationale

- 500-member groups should complete queries in <100ms
- Filtering at MongoDB reduces data transferred to application
- Reduces JSON payload size to frontend
- TanStack Query will cache the result

### Implementation

```typescript
// In groupsService.ts:
async function getGroupWithActiveMembers(groupId: string) {
  const group = await getGroupById(groupId);
  const members = await getGroupMembers(groupId, { status: "active" });
  return { ...group, members };
}

// In groupMembers model:
// Ensure index on { groupId: 1, status: 1 } for fast filtering
```

### Alternatives Considered

- **Client-side filtering**: Requires full member list over network; slower for 500+ members
- **Pagination**: Required if list gets very large; adds complexity
- ✅ **Query-time filtering with index**: Optimal for current scale (500 members)

---

## Research Task 4: Summary View Pattern

### Decision

**Use ShadCN `Dialog` component for group summary modal**

### Rationale

- Centered modal is familiar pattern for showing focused information
- Dialog component is fully accessible (Radix-based)
- Works well on mobile (full-screen or centered depending on viewport)
- Can be dismissed with ESC or backdrop click
- Groups summary + member list into coherent context

### Alternative: Dedicated Route

**Rejected** because:

- Group summary is auxiliary info, not primary flow
- Modal allows inline context switching (view summary while staying on group list)
- Reduces number of routes needed
- Better for mobile single-page experience

### Implementation

```tsx
// Create GroupSummaryModal component:
interface GroupSummaryModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Triggered by clicking View (eye) icon on group list/card
// Displays:
// - Group name (heading)
// - Description
// - Recurrence (e.g., "Weekly")
// - Time (e.g., "7:00 PM")
// - Owner name
// - Active members list (name, optional status)
```

### Alternatives Considered

- **Inline expansion**: Takes up list real estate; breaks mobile UX
- **Sheet (side drawer)**: Less discoverable than modal; requires dismissal
- ✅ **Modal dialog**: Best focus, accessibility, and mobile support

---

## Unknowns Resolved

All unknowns from specification have been researched:

- ✅ Soft-delete pattern determined
- ✅ Component selection finalized (DropdownMenu, Dialog)
- ✅ Member filtering strategy validated
- ✅ Summary view pattern chosen

---

## Phase 1 Readiness

All research tasks are complete. Ready to proceed to Phase 1 (data model, contracts, quickstart).

**Next**: Create `data-model.md` and `contracts/` artifacts based on research findings above.
