import { useMutation, useQueryClient } from "@tanstack/react-query";
import { publishMeeting } from "@/api/groups";
import { meetingViewQueryKey } from "./useMeetingViewQuery";
import { editableMeetingQueryKey } from "./useEditableMeetingQuery";
import type { PublishMeetingResponse } from "@/api/types/groups";
import { alert } from "@/utils/alert";

interface UsePublishMeetingMutationProps {
  groupId: string;
  meetingId: string;
}

export const usePublishMeetingMutation = ({
  groupId,
  meetingId,
}: UsePublishMeetingMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return publishMeeting(groupId, meetingId);
    },
    onSuccess: (data: PublishMeetingResponse) => {
      // Invalidate both view and edit queries to reflect published state
      queryClient.invalidateQueries({
        queryKey: meetingViewQueryKey(groupId, meetingId),
      });
      queryClient.invalidateQueries({
        queryKey: editableMeetingQueryKey(groupId, meetingId),
      });

      // Show success feedback
      alert.success("Meeting published successfully");
    },
    onError: (error: Error) => {
      alert.error(`Failed to publish meeting: ${error.message}`);
    },
  });
};
