import type { ReactNode } from "react";
import type { GroupFormMember } from "@/api/types/groups";

export interface GroupMemberListItem {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

type GroupMembersInputItem = GroupMemberListItem | GroupFormMember;

export interface GroupMembersListProps {
  members: GroupMembersInputItem[];
  maxDisplay?: number;
  variant?: "compact" | "detailed";
  seeAllSlot?: ReactNode;
}

const isUnifiedMember = (
  member: GroupMembersInputItem,
): member is GroupFormMember => "identifier" in member && "role" in member;

const normalizeMemberItem = (
  member: GroupMembersInputItem,
): GroupMemberListItem | null => {
  if (!isUnifiedMember(member)) {
    return member;
  }

  if (member.status === "removed") {
    return null;
  }

  return {
    id: member._id ?? member.identifier,
    name:
      member.role === "admin"
        ? `${member.name} (admin${member.status === "invited" ? ", invited" : ""})`
        : member.status === "invited"
          ? `${member.name} (invited)`
          : member.name,
    email: member.email ?? undefined,
    avatar: member.avatarUrl ?? undefined,
  };
};

export function GroupMembersList({
  members,
  maxDisplay = 10,
  variant = "compact",
  seeAllSlot = null,
}: GroupMembersListProps) {
  const normalizedMembers = members
    .map(normalizeMemberItem)
    .filter((member): member is GroupMemberListItem => member !== null);
  const visibleMembers = normalizedMembers.slice(0, maxDisplay);
  const hiddenCount = Math.max(
    0,
    normalizedMembers.length - visibleMembers.length,
  );

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {visibleMembers.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {member.name}
              </p>
              {variant === "detailed" && member.email && (
                <p className="truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
              )}
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                member.name.slice(0, 1).toUpperCase()
              )}
            </div>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <div className="text-xs text-muted-foreground">
          {seeAllSlot ?? `See all ${normalizedMembers.length} members`}
        </div>
      )}
    </div>
  );
}
