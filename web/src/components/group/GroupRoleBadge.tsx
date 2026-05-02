import type { GroupUserRole } from "@/api/types/groups";
import { Badge } from "../ui/badge";

export type GroupRoleBadgeProps = {
  userRole: GroupUserRole;
};

const UserRoleMapping: Record<GroupUserRole, { label: string; color: string }> =
  {
    owner: { label: "Owner", color: "bg-blue-500" },
    admin: { label: "Admin", color: "bg-green-500" },
    member: { label: "Member", color: "bg-gray-500" },
  };
export const GroupRoleBadge = ({ userRole }: GroupRoleBadgeProps) => {
  const roleInfo = UserRoleMapping[userRole];

  return <Badge className={`${roleInfo.color}`}>{roleInfo.label}</Badge>;
};
