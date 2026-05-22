import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelMeeting } from "@/api/groups";
import { meetingViewQueryKey } from "./useMeetingViewQuery";
import { editableMeetingQueryKey } from "./useEditableMeetingQuery";
import { myMeetingsQueryKey } from "./useMyMeetingsQuery";
import type { CancelMeetingResponse } from "@/api/types/groups";
import { alert } from "@/utils/alert";

interface UseCancelMeetingMutationProps {
  groupId: string;
  meetingId: string;
}

export const useCancelMeetingMutation = ({
  groupId,
  meetingId,
}: UseCancelMeetingMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return cancelMeeting(groupId, meetingId);
    },
    onSuccess: (_data: CancelMeetingResponse) => {
      // Invalidate meeting view/edit queries to reflect cancelled state
      queryClient.invalidateQueries({
        queryKey: meetingViewQueryKey(groupId, meetingId),
      });
      queryClient.invalidateQueries({
        queryKey: editableMeetingQueryKey(groupId, meetingId),
      });

      // Invalidate my meetings feed to update cancelled status and remove from upcoming
      queryClient.invalidateQueries({
        queryKey: myMeetingsQueryKey(),
      });

      // Show success feedback
      alert.success("Meeting cancelled successfully");
    },
    onError: (error: Error) => {
      alert.error(`Failed to cancel meeting: ${error.message}`);
    },
  });
};
