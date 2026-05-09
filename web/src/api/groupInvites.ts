import { apiClient } from "@/lib/apiClient";
import { toApiError } from "./types";
import type {
  JoinGroupInviteResponse,
  RespondToJoinGroupInviteInput,
  RespondToJoinGroupInviteResponse,
} from "./types/groupInvites";

export async function getJoinGroupInvite(
  membershipId: string,
  inviteToken: string,
): Promise<JoinGroupInviteResponse> {
  try {
    const { data } = await apiClient.get<JoinGroupInviteResponse>(
      `/group-invites/${membershipId}`,
      {
        params: {
          inviteToken,
        },
      },
    );

    return data;
  } catch (err) {
    throw await toApiError(err);
  }
}

export async function respondToJoinGroupInvite(
  membershipId: string,
  input: RespondToJoinGroupInviteInput,
): Promise<RespondToJoinGroupInviteResponse> {
  try {
    const { data } = await apiClient.post<RespondToJoinGroupInviteResponse>(
      `/group-invites/${membershipId}/respond`,
      input,
    );

    return {
      membershipId: data.membershipId,
      groupId: data.groupId,
      status: data.status,
      actedAt: data.actedAt,
      redirectTo: data.redirectTo ?? "",
    };
  } catch (err) {
    throw await toApiError(err);
  }
}
