import { create } from "zustand";
import { io } from "socket.io-client";

interface SocketState {
  socket: ReturnType<typeof io> | null;
  activeGroupIds: string[];
  setSocket: (socket: ReturnType<typeof io> | null) => void;
  setActiveGroupIds: (groupIds: string[]) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  activeGroupIds: [],
  setSocket: (socket) => {
    set({ socket, activeGroupIds: [] });
  },
  setActiveGroupIds: (groupIds) => set({ activeGroupIds: groupIds }),
}));
