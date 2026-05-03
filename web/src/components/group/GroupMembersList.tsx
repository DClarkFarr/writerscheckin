import type { ReactNode } from "react";
import type { GroupFormMember } from "@/api/types/groups";
import { Badge } from "@/components/ui/badge";

export interface GroupMemberListItem {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  badges?: Array<{
    label: string;
    colorClassName: string;
  }>;
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

  const badges: GroupMemberListItem["badges"] = [];

  if (member.role === "admin") {
    badges.push({ label: "Admin", colorClassName: "bg-green-500" });
  } else if (member.role === "owner") {
    badges.push({ label: "Owner", colorClassName: "bg-purple-500" });
  }

  if (member.status === "invited") {
    badges.push({ label: "Invited", colorClassName: "bg-blue-500" });
  }

  return {
    id: member._id ?? member.identifier,
    name: member.name,
    email: member.email ?? undefined,
    avatar: member.avatarUrl ?? undefined,
    badges,
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
              <div className="flex flex-wrap gap-2 items-center">
                <p className="truncate text-sm font-medium text-foreground">
                  {member.name}
                </p>
                {member.badges && member.badges.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {member.badges.map((badge) => (
                      <Badge
                        key={`${member.id}-${badge.label}`}
                        className={badge.colorClassName}
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {variant === "detailed" && member.email && (
                <p className="truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
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
