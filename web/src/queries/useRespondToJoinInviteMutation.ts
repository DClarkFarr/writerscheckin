import { respondToJoinGroupInvite } from "@/api/groupInvites";
import type {
  JoinGroupInviteAction,
  RespondToJoinGroupInviteResponse,
} from "@/api/types/groupInvites";
import { alert } from "@/utils/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { myGroupQueryKey } from "./useMyGroupsQuery";
import { myMeetingsQueryKey } from "./useMyMeetingsQuery";
import { joinGroupInviteQueryKey } from "./useJoinGroupInviteQuery";

interface UseRespondToJoinInviteMutationInput {
  membershipId: string;
  inviteToken: string;
}

export const useRespondToJoinInviteMutation = ({
  membershipId,
  inviteToken,
}: UseRespondToJoinInviteMutationInput) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: JoinGroupInviteAction) => {
      return respondToJoinGroupInvite(membershipId, {
        action,
        inviteToken,
      });
    },
    onSuccess: async (data: RespondToJoinGroupInviteResponse) => {
      await queryClient.invalidateQueries({
        queryKey: joinGroupInviteQueryKey(membershipId, inviteToken),
      });

      if (data.status === "accepted") {
        await queryClient.invalidateQueries({
          queryKey: myGroupQueryKey("invited"),
        });
        await queryClient.invalidateQueries({
          queryKey: myGroupQueryKey("accepted"),
        });
        await queryClient.invalidateQueries({
          queryKey: myMeetingsQueryKey(),
        });
        alert.success("Invite accepted");
      } else {
        alert.success("Invite declined");
      }
    },
    onError: (error: Error) => {
      alert.error(error.message || "Unable to respond to invite.");
    },
  });
};
