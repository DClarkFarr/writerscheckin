# Contract: UI Components

**Created**: 2026-05-02  
**Feature**: [Group Actions UI](../spec.md)

## Overview

This contract defines the React component interfaces and behaviors for the group actions UI. Components follow the Writers CheckIn architecture: hooks + components pattern.

---

## Components

### 1. GroupMemberActionsDropdown

**Purpose**: Display role-based actions for a group (View, Edit, Leave, Manage).

**File**: `web/src/components/group/GroupMemberActionsDropdown.tsx`  
**Hook**: `web/src/hooks/useGroupActions.ts`

#### Props Interface

```typescript
interface GroupMemberActionsDropdownProps {
  groupId: string;
  userRole: "owner" | "admin" | "member";
  onViewClick?: () => void; // Callback when View button clicked
  onEditClick?: () => void; // Callback when Edit button clicked
  onLeaveClick?: () => void; // Callback when Leave button clicked
  className?: string; // Optional Tailwind classes
}
```

#### Rendering Rules

**For `owner` or `admin` role**:

- View button (eye icon) → opens group summary modal
- Edit button (pencil icon) → navigates to group edit form
- Manage button (gear icon) → shows admin actions (deactivate group, remove members, etc.)

**For `member` role**:

- View button (eye icon) → opens group summary modal
- Leave button (log-out icon, red/destructive style) → triggers leave group action with confirmation

#### Component Behavior

```tsx
export const GroupMemberActionsDropdown: React.FC<
  GroupMemberActionsDropdownProps
> = ({
  groupId,
  userRole,
  onViewClick,
  onEditClick,
  onLeaveClick,
  className = "",
}) => {
  // Render DropdownMenu (from ShadCN)
  // - Trigger: vertical dots icon (three dots)
  // - Content: role-based actions
  // View action: always present
  // Edit, Manage actions: only if userRole is 'owner' or 'admin'
  // Leave action: only if userRole is 'member'
};
```

#### Event Handlers

- **View**: `onViewClick()` → triggers GroupSummaryModal open
- **Edit**: `onEditClick()` → navigates to `/admin/groups/:id/edit`
- **Manage**: `onManageClick()` → shows management options (existing functionality)
- **Leave**: `onLeaveClick()` → calls `useGroupActions().leaveGroup()` mutation

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

### GroupMemberActionsDropdown + GroupSummaryModal

```tsx
const MyGroupCard = ({ groupId, userRole }) => {
  const [summaryOpen, setSummaryOpen] = useState(false);

  return (
    <>
      <GroupMemberActionsDropdown
        groupId={groupId}
        userRole={userRole}
        onViewClick={() => setSummaryOpen(true)}
      />
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

  return (
    <GroupMemberActionsDropdown
      groupId={groupId}
      userRole={userRole}
      onLeaveClick={() => {
        if (confirm("Are you sure you want to leave this group?")) {
          leaveGroup.mutate(groupId);
        }
      }}
    />
  );
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
