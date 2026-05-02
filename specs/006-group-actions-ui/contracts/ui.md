# Contract: UI Components

**Created**: 2026-05-02  
**Feature**: [Group Actions UI](../spec.md)

## Overview

This contract defines the React component interfaces and behaviors for the group actions UI. Components follow the Writers CheckIn architecture: hooks + components pattern.

---

## Components

### 1. GroupMemberActionsDropdown

**Purpose**: Display member-specific actions for a group in a dedicated dropdown.

**File**: `web/src/components/group/GroupMemberActionsDropdown.tsx`  
**Hook**: `web/src/hooks/useGroupActions.ts`

#### Props Interface

```typescript
interface GroupMemberActionsDropdownProps {
  group: GroupSummaryItem;
}
```

#### Rendering Rules

- This dropdown is shown only for `member` role in list/detail views.
- It contains member-only actions (currently Leave).
- View is rendered as a separate standalone eye button outside the dropdown.

#### Component Behavior

```tsx
export const GroupMemberActionsDropdown: React.FC<
  GroupMemberActionsDropdownProps
> = ({ group }) => {
  // Render DropdownMenu (from ShadCN)
  // - Trigger: vertical dots icon (three dots)
  // - Content: member-specific actions
  // Leave action is primary action for members
};
```

#### Event Handlers

- **Leave**: Calls `useGroupActions().leaveGroup()` mutation

---

### 1b. GroupAdminActionsMenu

**Purpose**: Display admin/owner management actions in a dedicated admin menu.

**File**: `web/src/components/group/GroupAdminActionsDropdown.tsx`

#### Props Interface

```typescript
interface GroupAdminActionsMenuProps {
  group: GroupSummaryItem;
  disabled?: boolean;
}
```

#### Rendering Rules

- This dropdown is shown for `owner` and `admin` roles.
- Edit is exposed as a separate standalone pencil button outside the dropdown.
- The dropdown contains admin actions (activate/deactivate, upcoming meeting actions, create manual meeting).

#### Event Handlers

- **Activate/Deactivate**: invokes admin state actions (implementation-specific)
- **View Upcoming Meeting**: navigates to meeting edit route
- **Create Manual Meeting**: triggers create meeting mutation

---

### 2. GroupSummaryModal

**Purpose**: Display group information in a modal dialog.

**File**: `web/src/components/group/GroupSummaryModal.tsx`

#### Props Interface

```typescript
interface GroupSummaryModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}
```

#### Component Behavior

```tsx
export const GroupSummaryModal: React.FC<GroupSummaryModalProps> = ({
  groupId,
  isOpen,
  onClose,
}) => {
  // Use TanStack Query to fetch group data
  // Display in Dialog (ShadCN) with:
  // - Header: group name
  // - Content sections:
  //   - Description
  //   - Meeting info (recurrence, time)
  //   - Owner info
  //   - Member list (active only)
  // - Close button (X) and backdrop dismissal
};
```

#### Data Requirements

Fetches via TanStack Query:

```typescript
const { data: group, isLoading } = useQuery({
  queryKey: ["groups", groupId],
  queryFn: () => api.groups.getById(groupId),
});
```

#### Display Rules

| Field       | Display                | Notes                                 |
| ----------- | ---------------------- | ------------------------------------- |
| Group name  | Heading (large)        | Always required                       |
| Description | Paragraph              | Show placeholder if empty             |
| Recurrence  | Badge or label         | e.g., "Weekly"                        |
| Time        | Label with icon        | e.g., "7:00 PM"                       |
| Owner       | Name + optional avatar | Clickable to owner profile (optional) |
| Members     | List of active members | Filter `status: 'active'` only        |

#### Responsive Behavior

- **Desktop (>768px)**: Centered modal, ~500px wide
- **Mobile (<768px)**: Full-screen sheet or modal with padding

---

### 3. GroupMembersList

**Purpose**: Render list of active group members.

**File**: `web/src/components/group/GroupMembersList.tsx`

#### Props Interface

```typescript
interface GroupMembersListProps {
  members: Array<{
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  }>;
  maxDisplay?: number; // Show first N members, then "See all" link
  variant?: "compact" | "detailed"; // 'compact' = name only, 'detailed' = with email
  className?: string;
}
```

#### Component Behavior

```tsx
export const GroupMembersList: React.FC<GroupMembersListProps> = ({
  members,
  maxDisplay = 10,
  variant = "compact",
  className = "",
}) => {
  // Render list of members
  // - Compact: avatar + name
  // - Detailed: avatar + name + email
  // - If members.length > maxDisplay: show first N + "See all" link
};
```

#### Display Examples

**Compact variant** (in GroupSummaryModal):

```
👤 Jane Doe
👤 Alice Smith
👤 Bob Johnson
(... and 7 more)
```

**Detailed variant** (in group management):

```
👤 Jane Doe
   jane@example.com
👤 Alice Smith
   alice@example.com
```

---

### 4. useGroupActions Hook

**Purpose**: Handle group action mutations and state management.

**File**: `web/src/hooks/useGroupActions.ts`

#### Hook Interface

```typescript
interface UseGroupActionsReturn {
  // Mutations
  leaveGroup: {
    mutate: (groupId: string) => void;
    isPending: boolean;
    error: Error | null;
    isSuccess: boolean;
  };

  // Callbacks
  onLeaveGroupSuccess?: () => void;
  onLeaveGroupError?: (error: Error) => void;
}

export const useGroupActions = (options?: {
  onLeaveSuccess?: () => void;
  onLeaveError?: (error: Error) => void;
}): UseGroupActionsReturn => {
  // Implementation using TanStack Query useMutation
};
```

#### Implementation Details

```typescript
export const useGroupActions = (options?: {
  onLeaveSuccess?: () => void;
  onLeaveError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  const leaveGroupMutation = useMutation({
    mutationFn: (groupId: string) => api.groups.leave(groupId),

    onSuccess: (data, groupId) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["groups", groupId],
      });

      // Show success toast
      toast.success("You have left the group");

      // Call optional callback
      options?.onLeaveSuccess?.();
    },

    onError: (error: Error) => {
      // Map API error to user message
      const message = mapApiErrorToMessage(error);
      toast.error(message);

      // Call optional callback
      options?.onLeaveError?.(error);
    },
  });

  return {
    leaveGroup: {
      mutate: leaveGroupMutation.mutate,
      isPending: leaveGroupMutation.isPending,
      error: leaveGroupMutation.error,
      isSuccess: leaveGroupMutation.isSuccess,
    },
  };
};
```

#### Error Mapping

```typescript
function mapApiErrorToMessage(error: Error): string {
  if (error.message.includes("not found")) {
    return "Group not found";
  }
  if (error.message.includes("not a member")) {
    return "You are not a member of this group";
  }
  if (error.message.includes("already left")) {
    return "You have already left this group";
  }
  return "Failed to leave group. Please try again.";
}
```

---

## Integration Points

### Standalone Buttons + Separate Menus

```tsx
const MyGroupCard = ({ groupId, userRole }) => {
  const [summaryOpen, setSummaryOpen] = useState(false);

  return (
    <>
      {userRole === "member" ? (
        <>
          <Button onClick={() => setSummaryOpen(true)}>
            <EyeIcon />
          </Button>
          <GroupMemberActionsDropdown group={group} />
        </>
      ) : (
        <>
          <Button
            onClick={() =>
              navigate({ to: "/groups/$groupId/edit", params: { groupId } })
            }
          >
            <PencilIcon />
          </Button>
          <GroupAdminActionsMenu group={group} />
        </>
      )}

      <GroupSummaryModal
        groupId={groupId}
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
      />
    </>
  );
};
```

### GroupMemberActionsDropdown + useGroupActions

```tsx
const MyGroupCard = ({ groupId, userRole }) => {
  const { leaveGroup } = useGroupActions({
    onLeaveSuccess: () => {
      // Navigate away or refresh list
      navigate("/groups");
    },
  });

  return <GroupMemberActionsDropdown group={group} />;
};
```

---

## Styling Guidelines

All components use:

- **Tailwind CSS v4** for layout and spacing
- **ShadCN UI** for interactive elements (Button, DropdownMenu, Dialog, etc.)
- **lucide-react** for icons (Eye, Pencil, LogOut, Gear, etc.)

**Color scheme for actions**:

- View (Eye): Default / neutral (blue)
- Edit (Pencil): Primary / blue
- Leave (LogOut): Destructive / red (warns of irreversible action)
- Manage (Gear): Primary / blue

**Do NOT** add component-specific styling to `web/src/index.css`. Use:

- Component-level styles in `GroupMemberActionsDropdown.tsx` (via Tailwind `className`)
- ShadCN component variants for button states
- Tailwind `@apply` in component files if needed

---

## Completeness Checklist

- ✅ All components documented with props
- ✅ Rendering rules specified
- ✅ Event handlers defined
- ✅ Error handling documented
- ✅ Integration examples provided
- ✅ Styling guidelines clear
- ✅ Responsive behavior specified
- ✅ Hook interface documented with error mapping
