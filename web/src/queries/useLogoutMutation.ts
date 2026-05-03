import { logout } from "@/api/auth";
import { cancelAndSnapshot, rollbackSnapshot } from "@/queries/optimisticCache";
import { meQueryKey } from "@/queries/useMeQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onMutate: async () => {
      const snapshots = await cancelAndSnapshot(queryClient, [meQueryKey()]);
      queryClient.setQueryData(meQueryKey(), undefined);
      return { snapshots };
    },
    onError: (_error, _input, context) => {
      rollbackSnapshot(queryClient, context?.snapshots);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: meQueryKey() });
    },
  });
};
