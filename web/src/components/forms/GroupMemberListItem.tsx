import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { deriveAvatarInitials } from "@/components/layout/AvatarInitials";
import { deriveAvatarColor } from "@/utils/avatarColor";
import type { GroupFormMember, GroupMemberRole } from "@/api/types/groups";

export interface GroupMemberListItemProps {
  member: GroupFormMember;
  onRoleChange: (memberId: string, role: GroupMemberRole) => void;
  onDelete: (memberId: string) => void;
  isDeleting?: boolean;
}

const ROLE_LABELS: Record<GroupMemberRole, string> = {
  admin: "Admin",
  member: "Member",
  owner: "Owner",
};

const renderAvatar = (name: string, avatarUrl: string | null) => {
  const initials = deriveAvatarInitials(name);
  const backgroundColor = deriveAvatarColor(name);

  return (
    <Avatar className="size-7 flex-shrink-0">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback
        style={{ backgroundColor, color: "white" }}
        className="text-xs"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export function GroupMemberListItem({
  member,
  onRoleChange,
  onDelete,
  isDeleting = false,
}: GroupMemberListItemProps) {
  const displayLabel = member.name || member.email || member.identifier;
  const isInvite = !member.userId;
  const memberId = member._id ?? member.identifier;

  return (
    <li className="flex items-center gap-2 text-sm">
      {renderAvatar(displayLabel ?? "?", member.avatarUrl)}

      <div className="min-w-0 flex-1">
        <div className="truncate text-foreground">
          {displayLabel}
          {isInvite ? (
            <span className="ml-1 text-xs text-muted-foreground">(invite)</span>
          ) : null}
        </div>
        {member.email && member.email !== displayLabel ? (
          <div className="truncate text-xs text-muted-foreground">
            {member.email}
          </div>
        ) : null}
      </div>

      <select
        value={member.role}
        onChange={(event) =>
          onRoleChange(memberId, event.target.value as GroupMemberRole)
        }
        className="rounded-md border border-input bg-gray-100 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label={`Role for ${displayLabel}`}
      >
        {(Object.keys(ROLE_LABELS) as GroupMemberRole[]).map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(memberId)}
        disabled={isDeleting}
        aria-label={`Remove ${displayLabel}`}
      >
        ×
      </Button>
    </li>
  );
}
