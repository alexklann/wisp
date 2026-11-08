import { useAuthStore } from "./stores/useAuthStore";
import { useUIStore } from "./stores/useUIStore";
import AuthPage from "./AuthPage";
import { WebsocketProvider } from "./lib/WebsocketProvider";
import ChatInterface from "./components/ChatInterface";
import ServerSidebar from "./components/ServerSidebar";
import ModalPortal from "./components/ModalPortal";
import { useEffect } from "react";
import MemberSidebar from "./components/MemberSidebar";
import { Toaster } from "react-hot-toast";
import { useStaleBuild } from "./lib/useStaleBuild";

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

function UpdateBanner({ live }: { live: string | null }) {
  if (!live) return null;

  return (
    <div className="absolute inset-0 bg-black/50 z-90 flex justify-center items-center">
      <div className="flex flex-col w-full sm:w-fit bg-surface border border-stroke p-4 rounded-md text-text mx-4">
        <h2>New Version!</h2>
        <span className="text-sm text-text/50">Version {live}</span>
        <span>Reload the app to get the newest version!</span>
      </div>
    </div>
  );
}

export default function App() {
  const liveBuild = useStaleBuild();
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
          const response = await fetch("/api/push/key");
          if (!response.ok) {
            console.error("Error fetching public key from backend");
            return;
          }

          const json = await response.json();

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(json.publicKey),
          });

          await fetch("/api/push/subscribe", {
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
        <UpdateBanner live={liveBuild} />
        <Toaster position="bottom-right" />
        <ModalPortal />
        <WebsocketProvider>
          <div className="w-screen h-screen flex flex-row overflow-hidden bg-background md:p-3 gap-3">
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
