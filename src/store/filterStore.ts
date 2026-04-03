import { create } from "zustand";

interface FilterState {
  search: string;
  setSearch: (search: string) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  search: "",
  setSearch: (search) => set({ search }),
}));
