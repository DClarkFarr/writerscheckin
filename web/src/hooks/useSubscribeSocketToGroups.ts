import { useSocketStore } from "@/store/socketStore";
import { useEffect } from "react";

export const useSubscribeSocketToGroups = (incomingGroupIds: string[]) => {
  const { socket, activeGroupIds, setActiveGroupIds } = useSocketStore();

  useEffect(() => {
    if (
      JSON.stringify(activeGroupIds) !== JSON.stringify(incomingGroupIds) &&
      socket
    ) {
      const toSubscribe = incomingGroupIds.filter(
        (id) => !activeGroupIds.includes(id),
      );

      toSubscribe.forEach((groupId) => {
        socket?.emit("subscribe", { groupId });
      });

      const allGroupIds = Array.from(
        new Set([...activeGroupIds, ...incomingGroupIds]),
      );
      setActiveGroupIds(allGroupIds);
    }
  }, [incomingGroupIds, socket]);
};
