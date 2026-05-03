export const queryKeys = {
  me: () => ["me"] as const,
  myGroups: () => ["my-groups"] as const,
  groupById: (groupId: string | undefined) => ["groups", groupId] as const,
  groupForm: (groupId: string | undefined) => ["group-form", groupId] as const,
  memberSearch: (query: string, groupId?: string) =>
    ["members", "search", query, groupId] as const,
} as const;

export type QueryKeys = typeof queryKeys;
