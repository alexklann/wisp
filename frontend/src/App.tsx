import { useAuthStore } from "./stores/useAuthStore";
import { useUIStore } from "./stores/useUIStore";
import AuthPage from "./AuthPage";
import { WebsocketProvider } from "./lib/WebsocketProvider";
import ChatInterface from "./components/ChatInterface";
import ServerSidebar from "./components/ServerSidebar";
import ModalPortal from "./components/ModalPortal";
import { useEffect } from "react";
import MemberSidebar from "./components/MemberSidebar";

/**
 * AI-Generated with DeepSeek-v4 Flash
 * @param base64String
 * @returns
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function App() {
  const token = useAuthStore((state) => state.token);
  const renderedPage = useUIStore((state) => state.renderedPage);

  useEffect(() => {
    if (!token || renderedPage != "index") return;

    const setupPush = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      try {
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const existing = await registration.pushManager.getSubscription();
        if (!existing) {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/push/key`);
          if (!response.ok) {
            console.error("Error fetching public key from backend");
            return;
          }

          const json = await response.json();

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              json.publicKey,
            ),
          });

          await fetch(`${import.meta.env.VITE_BACKEND_URL}/push/subscribe`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(subscription),
          });
        }

        console.log("Push setup completed");
      } catch (error) {
        console.error("Push setup failed:", error);
      }
    };

    setupPush();
  }, [renderedPage, token]);

  if (!token) {
    return <AuthPage />;
  }

  if (renderedPage == "index") {
    return (
      <>
        <ModalPortal />
        <WebsocketProvider>
          <div className="w-screen h-screen flex flex-row bg-background p-3 gap-3">
            <ServerSidebar />
            <ChatInterface />
            <MemberSidebar />
          </div>
        </WebsocketProvider>
      </>
    );
  }

  if (renderedPage == "auth") {
    return <AuthPage />;
  }
}
