import { create } from "zustand";
import type { AuthUser } from "../api/types";

interface AuthState {
  isLoaded: boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoaded: false,
  user: null,
  isAuthenticated: false,
  setUser: (user) =>
    set({ user, isAuthenticated: user !== null, isLoaded: true }),
  clearUser: () => set({ user: null, isAuthenticated: false, isLoaded: true }),
}));
