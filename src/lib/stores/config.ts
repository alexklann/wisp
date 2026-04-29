import { Store } from "@tauri-apps/plugin-store";

export class ConfigStore {
  private static store: Store | null = null;

  private static async getStore(): Promise<Store> {
    if (!this.store) this.store = await Store.load("config.dat");
    return this.store;
  }

  static async getApiUrl(): Promise<string> {
    const store = await this.getStore();
    return (await store.get<string>("api_url")) ?? "localhost:3000";
  }

  static async getApiProtocol(type: "http" | "ws"): Promise<string> {
    const store = await this.getStore();
    const isSecure = (await store.get<boolean>("api_secure")) ?? true;
    if (type === "http") {
      return isSecure ? "https" : "http";
    }
    return isSecure ? "wss" : "ws";
  }

  static async setApiUrl(url: string | null, secure: boolean): Promise<void> {
    const store = await this.getStore();
    await store.set("api_url", url);
    await store.set("api_secure", secure);
    await store.save();
  }

  static async isConfigured(): Promise<boolean> {
    const store = await this.getStore();
    const url = await store.get<string>("api_url");
    return url !== null && url !== undefined;
  }
}
