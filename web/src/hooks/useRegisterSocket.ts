import { io } from "socket.io-client";

import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { useSocketStore } from "@/store/socketStore";

export const useRegisterSocket = () => {
  const user = useAuthStore((state) => state.user);

  const { socket, setSocket } = useSocketStore();

  useEffect(() => {
    if (user) {
      const s = io(import.meta.env.VITE_SOCKET_URL, {
        auth: {
          userId: user.id,
        },
      });

      (() => setSocket(s))();

      s.on("connect", () => {
        console.log("Connected to Socket.IO server");
      });

      s.on("disconnect", () => {
        console.log("Disconnected from Socket.IO server");
      });
    } else {
      socket?.off("connect");
      socket?.off("disconnect");
    }

    return () => {
      socket?.off("connect");
      socket?.off("disconnect");
    };
  }, [user]);
};
