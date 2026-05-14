import {
  requestToJoinMeetingInvite,
  respondToJoinGroupInvite,
  respondToMeetingInviteDecision,
} from "@/api/groupInvites";
import type {
  JoinGroupInviteAction,
  MeetingInviteDecision,
  RequestToJoinMeetingInviteResponse,
  RespondToMeetingInviteDecisionResponse,
  RespondToJoinGroupInviteResponse,
} from "@/api/types/groupInvites";
import { alert } from "@/utils/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { myGroupQueryKey } from "./useMyGroupsQuery";
import { myMeetingsQueryKey } from "./useMyMeetingsQuery";
import { joinGroupInviteQueryKey } from "./useJoinGroupInviteQuery";
import { useMeetingViewQuery } from "./useMeetingViewQuery";

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

interface UseRespondToMeetingInviteDecisionMutationInput {
  groupId: string;
  meetingId: string;
}

export const useRespondToMeetingInviteDecisionMutation = ({
  groupId,
  meetingId,
}: UseRespondToMeetingInviteDecisionMutationInput) => {
  const queryClient = useQueryClient();

  return useMutation<
    RespondToMeetingInviteDecisionResponse,
    Error,
    MeetingInviteDecision
  >({
    mutationFn: async (decision: MeetingInviteDecision) => {
      return respondToMeetingInviteDecision({
        groupId,
        meetingId,
        decision,
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: useMeetingViewQuery.key(groupId, meetingId),
      });

      await queryClient.invalidateQueries({
        queryKey: myGroupQueryKey("invited"),
      });
      await queryClient.invalidateQueries({
        queryKey: myGroupQueryKey("accepted"),
      });
      await queryClient.invalidateQueries({
        queryKey: myMeetingsQueryKey(),
      });

      if (data.updatedState === "active_member") {
        alert.success("Invite accepted");
      } else if (data.updatedState === "declined_or_left") {
        alert.success("Invite declined");
      }
    },
    onError: (error) => {
      alert.error(error.message || "Unable to respond to invite.");
    },
  });
};

interface UseRequestToJoinMeetingInviteMutationInput {
  groupId: string;
  meetingId: string;
}

export const useRequestToJoinMeetingInviteMutation = ({
  groupId,
  meetingId,
}: UseRequestToJoinMeetingInviteMutationInput) => {
  const queryClient = useQueryClient();

  return useMutation<RequestToJoinMeetingInviteResponse, Error, void>({
    mutationFn: async () => {
      return requestToJoinMeetingInvite({
        groupId,
        meetingId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: useMeetingViewQuery.key(groupId, meetingId),
      });

      alert.success("Request to join sent to the group owner.");
    },
    onError: (error) => {
      alert.error(error.message || "Unable to send request right now.");
    },
  });
};
