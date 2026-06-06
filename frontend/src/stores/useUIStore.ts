import { create } from "zustand";

interface UIState {
  renderedPage: string | null;
  changePage: (page: string) => void;

  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  renderedPage: "index",
  changePage: (page) => set({ renderedPage: page }),

  editingMessageId: null,
  setEditingMessageId: (id) => set({ editingMessageId: id }),
}));
