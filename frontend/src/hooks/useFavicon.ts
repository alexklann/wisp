import { useEffect } from "react";
import { useUIStore } from "../stores/useUIStore";

const DEFAULT_ICON = "/favicon.ico";
const UNREAD_ICON = "/favicon_unread.ico";

export function useFavicon() {
  const hasUnreadMessages = useUIStore((state) => state.hasUnreadMessages);

  useEffect(() => {
    const href = hasUnreadMessages ? UNREAD_ICON : DEFAULT_ICON;

    document
      .querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
      .forEach((link) => (link.href = href));
  }, [hasUnreadMessages]);
}
