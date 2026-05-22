import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMeeting } from "@/api/groups";
import { meetingViewQueryKey } from "./useMeetingViewQuery";
import { editableMeetingQueryKey } from "./useEditableMeetingQuery";
import type {
  UpdateMeetingInput,
  UpdateMeetingResponse,
} from "@/api/types/groups";
import { alert } from "@/utils/alert";

interface UseSaveMeetingMutationProps {
  groupId: string;
  meetingId: string;
}

export const useSaveMeetingMutation = ({
  groupId,
  meetingId,
}: UseSaveMeetingMutationProps) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMeetingInput) => {
      return updateMeeting(groupId, meetingId, input);
    },
    onSuccess: (_data: UpdateMeetingResponse) => {
      // Invalidate both view and edit queries to reflect server state
      queryClient.invalidateQueries({
        queryKey: meetingViewQueryKey(groupId, meetingId),
      });
      queryClient.invalidateQueries({
        queryKey: editableMeetingQueryKey(groupId, meetingId),
      });

      // Show success feedback
      alert.success("Meeting saved successfully");
    },
    onError: (error: Error) => {
      alert.error(`Failed to save meeting: ${error.message}`);
    },
  });
};
