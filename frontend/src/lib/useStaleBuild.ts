import { useEffect, useState } from "react";

const COOLDOWN_MS = 30_000;

export function useStaleBuild() {
  const [live, setLive] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    let last = 0;
    let ac: AbortController | null = null;

    const check = async (force = false) => {
      if (document.visibilityState !== "visible") return;
      if (!force && Date.now() - last < COOLDOWN_MS) return;
      last = Date.now();

      ac?.abort();
      ac = new AbortController();
      try {
        const res = await fetch("/build-id.txt", {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) return;
        const id = (await res.text()).trim();
        setLive(id === __BUILD_ID__ ? null : id);
      } catch {}
    };

    const onVisible = () => void check();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void check(true);
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onPageShow);
    void check(true);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      ac?.abort();
    };
  }, []);

  return live;
}
