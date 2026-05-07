import { ObjectId } from "mongodb";
import { listUsers, listUsersByIds } from "../models/users";
import { listGroupMembersByGroupId } from "../models/groupMembers";
import { ensureObjectId } from "../models/types";

export interface SearchMembersInput {
  query: string;
  excludeUserId?: string;
  groupId?: string;
  limit?: number;
}

export interface MemberSearchResultItem {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface MemberSearchInviteOption {
  email: string;
  suggested: true;
}

export interface SearchMembersResult {
  results: MemberSearchResultItem[];
  inviteOption: MemberSearchInviteOption | null;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (query: string): boolean =>
  emailRegex.test(query.trim().toLowerCase());

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const searchMembers = async (
  input: SearchMembersInput,
): Promise<SearchMembersResult> => {
  const normalizedQuery = input.query.trim().toLowerCase();
  const limit = Math.min(
    typeof input.limit === "number" ? input.limit : DEFAULT_LIMIT,
    MAX_LIMIT,
  );

  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return { results: [], inviteOption: null };
  }

  const isEmailQuery = isValidEmail(normalizedQuery);

  let excludedUserIds = new Set<string>();

  if (input.excludeUserId) {
    excludedUserIds.add(
      ensureObjectId(input.excludeUserId, "excludeUserId").toHexString(),
    );
  }

  if (input.groupId) {
    const groupMembers = await listGroupMembersByGroupId(input.groupId, {
      limit: 500,
    });

    for (const member of groupMembers) {
      if (member.userId && member.status !== "removed") {
        excludedUserIds.add(member.userId.toHexString());
      }
    }
  }

  const allUsers = await listUsers({ limit: 1000 });
  const exactEmailMatch = isEmailQuery
    ? allUsers.find((user) => user.email === normalizedQuery)
    : null;

  const exactMatches: typeof allUsers = [];
  const partialMatches: typeof allUsers = [];

  for (const user of allUsers) {
    if (excludedUserIds.has(user._id.toHexString())) {
      continue;
    }

    if (isEmailQuery && user.email === normalizedQuery) {
      exactMatches.push(user);
      continue;
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
    if (
      fullName.includes(normalizedQuery) ||
      user.email.toLowerCase().includes(normalizedQuery)
    ) {
      partialMatches.push(user);
    }
  }

  const rankedUsers = [...exactMatches, ...partialMatches].slice(0, limit);
  const results: MemberSearchResultItem[] = rankedUsers.map((user) => ({
    _id: user._id.toHexString(),
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
    email: user.email,
    avatar: null,
  }));

  let inviteOption: MemberSearchInviteOption | null = null;

  if (
    isEmailQuery &&
    !exactEmailMatch &&
    !excludedUserIds.has(
      allUsers
        .find((user) => user.email === normalizedQuery)
        ?._id.toHexString() ?? "",
    )
  ) {
    inviteOption = {
      email: normalizedQuery,
      suggested: true,
    };
  }

  return { results, inviteOption };
};
