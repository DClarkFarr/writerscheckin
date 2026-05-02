import type { AuthUser } from "@/api/types";
import { deriveAvatarColor } from "@/utils/avatarColor";

const UNKNOWN_USER_LABEL = "Unknown user";

export interface AccountMenuIdentity {
  displayName: string;
  email: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
}

export function buildAccountMenuIdentity(user: AuthUser): AccountMenuIdentity {
  const firstName = user.firstName?.trim() ?? "";
  const lastName = user.lastName?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const displayName = fullName || user.email || UNKNOWN_USER_LABEL;
  const avatarUrl =
    (user as AuthUser & { avatarUrl?: string | null }).avatarUrl ?? undefined;

  return {
    displayName,
    email: user.email,
    initials: deriveInitials(displayName),
    avatarColor: deriveAvatarColor(displayName),
    avatarUrl: avatarUrl || undefined,
  };
}

function deriveInitials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  const first = words[0][0] ?? "";
  const last = words[words.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase() || "??";
}
