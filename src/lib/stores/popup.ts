import { writable } from "svelte/store";
import { apiFetch } from "./api";

type Popup = {
  type: "joinServer";
  onConfirm: (serverId: string) => {};
} | null;

export const popup = writable<Popup>(null);
