import { Store } from "@tauri-apps/plugin-store";
import { writable } from "svelte/store";

export interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export class AuthStore {
  static readonly token = writable<string | null>(null);
  static readonly user = writable<User | null>(null);
  private static store: Store | null = null;

  private static async getStore(): Promise<Store> {
    if (!this.store) this.store = await Store.load("auth.dat");
    return this.store;
  }

  static async load() {
    const store = await this.getStore();
    const savedToken = await store.get<string>("token");
    const savedUser = await store.get<User>("user");
    if (savedToken) this.token.set(savedToken);
    if (savedUser) this.user.set(savedUser);
  }

  static async save(token: string, user: User) {
    const store = await this.getStore();
    await store.set("token", token);
    await store.set("user", user);
    await store.save();
    this.token.set(token);
    this.user.set(user);
  }

  static async clear() {
    const store = await this.getStore();
    await store.delete("token");
    await store.delete("user");
    await store.save();
    this.token.set(null);
    this.user.set(null);
  }
}
