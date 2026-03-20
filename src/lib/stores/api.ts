import { AuthStore } from "$lib/stores/auth";
import { get } from "svelte/store";
import { goto } from "$app/navigation";

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = get(AuthStore.token);
  console.log("apiFetch token:", token, "url:", url);

  const response = await fetch(`http://localhost:3000${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    await AuthStore.clear();
    goto("/login");
  }

  return response;
}
