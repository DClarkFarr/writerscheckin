import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { GroupInviteAction } from "@/api/types/groups";
import { useMyGroupsQuery } from "@/queries/useMyGroupsQuery";
import { useRespondToGroupInviteMutation } from "@/queries/useRespondToGroupInviteMutation";

export interface GroupInviteViewModel {
  membershipId: string;
  groupId: string;
  groupName: string;
  address: string;
  meetingStartsAt: string | null;
  inviteCreatedAt: string;
}

export interface UseGroupInvitesOptions {
  enabled?: boolean;
}

const sortByInviteCreatedAtDesc = (
  left: GroupInviteViewModel,
  right: GroupInviteViewModel,
): number => {
  return (
    new Date(right.inviteCreatedAt).getTime() -
    new Date(left.inviteCreatedAt).getTime()
  );
};

export function useGroupInvites(options: UseGroupInvitesOptions = {}) {
  const navigate = useNavigate();

  const {
    mutateAsync: respondToInvite,
    isPending: isResponding,
    error: actionError,
  } = useRespondToGroupInviteMutation();
  const {
    groups,
    isLoading,
    isError,
    errorMessage,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyGroupsQuery(
    {
      status: "invited",
    },
    {
      enabled: options.enabled !== false,
    },
  );

  const pendingInvites = useMemo<GroupInviteViewModel[]>(() => {
    const uniqueByGroupId = new Map(
      groups.map((group) => [group.groupId, group]),
    );

    return Array.from(uniqueByGroupId.values())
      .map((group) => ({
        membershipId: group.membershipId ?? group.groupId,
        groupId: group.groupId,
        groupName: group.name,
        address: group.address ?? "",
        meetingStartsAt: group.nextUpcomingMeeting?.startsAt ?? null,
        inviteCreatedAt: group.membershipCreatedAt ?? group.createdAt,
      }))
      .sort(sortByInviteCreatedAtDesc);
  }, [groups]);

  const handleInviteAction = async (
    membershipId: string,
    groupId: string,
    action: GroupInviteAction,
  ) => {
    const result = await respondToInvite({
      membershipId,
      groupId,
      action,
    });

    if (action === "accept") {
      navigate({
        to: "/groups/$groupId/view",
        params: {
          groupId: result.groupId,
        },
      });
    }

    return result;
  };

  return {
    pendingInvites,
    pendingInviteCount: pendingInvites.length,
    isResponding,
    actionError:
      actionError instanceof Error
        ? actionError.message
        : actionError
          ? "Unable to update invite."
          : null,
    handleInviteAction,
    isLoading,
    isError,
    errorMessage,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
