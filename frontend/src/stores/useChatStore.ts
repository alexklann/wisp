import { create } from "zustand";
import type Server from "../types/server";
import type Channel from "../types/channel";
import type Message from "../types/message";

interface ChatState {
  servers: Server[];
  channels: Channel[];
  messages: Message[];

  activeServerId: string | null;
  activeChannelId: string | null;

  setServers: (servers: Server[]) => void;
  setChannels: (channels: Channel[]) => void;
  setMessages: (messages: Message[]) => void;

  setActiveServer: (serverId: string) => void;
  setActiveChannel: (channelId: string) => void;

  addMessage: (message: Message) => void;
  addChannel: (channel: Channel) => void;

  deleteMessage: (messageId: number) => void;
  editMessage: (messageId: number, content: string) => void;

  prependMessages: (olderMessages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  servers: [],
  channels: [],
  messages: [],

  activeServerId: null,
  activeChannelId: null,

  setServers: (servers) => set({ servers }),
  setChannels: (channels) => set({ channels }),
  setMessages: (messages) => set({ messages }),

  setActiveServer: (serverId) => set({ activeServerId: serverId }),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  addChannel: (channel) =>
    set((state) => ({ channels: [...state.channels, channel] })),

  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),
  editMessage: (messageId, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: content, edited_at: Date.now() }
          : msg,
      ),
    })),

  prependMessages: (olderMessages) =>
    set((state) => ({
      messages: [...olderMessages, ...state.messages]
    }))
}));
