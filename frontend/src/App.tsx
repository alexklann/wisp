import { useAuthStore } from "./stores/useAuthStore";
import { useUIStore } from "./stores/useUIStore";
import AuthPage from "./AuthPage";
import { WebsocketProvider } from "./lib/WebsocketProvider";
import ChatInterface from "./components/ChatInterface";
import ServerSidebar from "./components/ServerSidebar";
import ModalPortal from "./components/ModalPortal";

export default function App() {
  const token = useAuthStore((state) => state.token);
  const renderedPage = useUIStore((state) => state.renderedPage);

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
          </div>
        </WebsocketProvider>
      </>
    );
  }

  if (renderedPage == "auth") {
    return <AuthPage />;
  }
}
