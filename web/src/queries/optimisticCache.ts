import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type OptimisticSnapshot = {
  key: QueryKey;
  value: unknown;
};

export const cancelAndSnapshot = async (
  queryClient: QueryClient,
  keys: QueryKey[],
): Promise<OptimisticSnapshot[]> => {
  const snapshots: OptimisticSnapshot[] = [];

  for (const key of keys) {
    await queryClient.cancelQueries({ queryKey: key });
    snapshots.push({ key, value: queryClient.getQueryData(key) });
  }

  return snapshots;
};

export const rollbackSnapshot = (
  queryClient: QueryClient,
  snapshots: OptimisticSnapshot[] | undefined,
): void => {
  if (!snapshots?.length) {
    return;
  }

  for (const snapshot of snapshots) {
    queryClient.setQueryData(snapshot.key, snapshot.value);
  }
};
