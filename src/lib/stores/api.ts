import { AuthStore } from "$lib/stores/auth";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { ConfigStore } from "./config";

export async function getServerDomain() {
  const baseUrl = await ConfigStore.getApiUrl();
  const protocol = await ConfigStore.getApiProtocol("http");
  return `${protocol}://${baseUrl}`;
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const baseUrl = await ConfigStore.getApiUrl();
  const protocol = await ConfigStore.getApiProtocol("http");
  const token = get(AuthStore.token);

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers || {}) as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${protocol}://${baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await AuthStore.clear();
    await goto("/login");
  }

  return response;
}
