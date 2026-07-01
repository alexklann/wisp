import { create } from "zustand";
import type { ModalType } from "../types/ModalType";

interface UIState {
  renderedPage: string | null;
  changePage: (page: string) => void;

  editingMessageId: number | null;
  setEditingMessageId: (id: number | null) => void;

  replyingMessageId: number | null;
  setReplyingMessageId: (id: number | null) => void;

  replyingMessageContent: string | null;
  setReplyingMessageContent: (content: string | null) => void;

  replyingMessageUsername: string | null;
  setReplyingMessageUsername: (username: string | null) => void;

  clearReplyingMessage: () => void;

  selectedImageURL: string | null;
  selectedImageFilename: string | null;

  setSelectedImageURL: (url: string | null) => void;
  setSelectedImageFilename: (filename: string | null) => void;

  activeModal: ModalType | null;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;

  isSidebarOpen: boolean;
  setIsSidebarOpen: (state: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  renderedPage: "index",
  changePage: (page) => set({ renderedPage: page }),

  editingMessageId: null,
  setEditingMessageId: (id) => set({ editingMessageId: id }),

  replyingMessageId: null,
  setReplyingMessageId: (id) => set({ replyingMessageId: id }),

  replyingMessageContent: null,
  setReplyingMessageContent: (content) =>
    set({ replyingMessageContent: content }),

  replyingMessageUsername: null,
  setReplyingMessageUsername: (username) =>
    set({ replyingMessageUsername: username }),

  clearReplyingMessage: () =>
    set({
      replyingMessageId: null,
      replyingMessageContent: null,
      replyingMessageUsername: null,
    }),

  selectedImageURL: null,
  selectedImageFilename: null,

  setSelectedImageURL: (url) => set({ selectedImageURL: url }),
  setSelectedImageFilename: (filename) =>
    set({ selectedImageFilename: filename }),

  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  isSidebarOpen: false,
  setIsSidebarOpen: (state) => set({ isSidebarOpen: state }),
}));
