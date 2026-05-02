import { create } from "zustand";

interface HomeState {
  view: "meetings" | "groups";
  setView: (view: HomeState["view"]) => void;
}

export const useHomeStore = create<HomeState>((set) => ({
  view: "meetings",
  setView: (view) => set({ view }),
}));
