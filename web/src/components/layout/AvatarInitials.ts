export function deriveAvatarInitials(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return "??";
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    const initials = `${first}${last}`.toUpperCase();
    return initials || "??";
  }

  if (trimmed.length === 1) {
    return trimmed.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}
