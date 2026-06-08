import { create } from "zustand";
import type { ModalType } from "../types/ModalType";

interface UIState {
  renderedPage: string | null;
  changePage: (page: string) => void;

  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;

  activeModal: ModalType | null;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  renderedPage: "index",
  changePage: (page) => set({ renderedPage: page }),

  editingMessageId: null,
  setEditingMessageId: (id) => set({ editingMessageId: id }),

  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
