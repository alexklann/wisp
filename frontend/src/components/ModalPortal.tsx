import { useEffect } from "react";
import { useUIStore } from "../stores/useUIStore";
import ServerUsageModal from "./ServerUsageModal";
import CreateChannelModal from "./CreateChannelModal";
import CreateServerModal from "./CreateServerModal";
import JoinServerModal from "./JoinServerModal";

export default function ModalPortal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", (e) => {
      handleKeyPress(e);
    });
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [closeModal]);

  if (activeModal === null) {
    return <></>;
  }

  return (
    <div
      onClick={() => closeModal()}
      className="absolute inset-0 flex justify-center items-center bg-black/75 z-90"
    >
      {activeModal === "joinServer" ? (
        <JoinServerModal />
      ) : activeModal === "createServer" ? (
        <CreateServerModal />
      ) : activeModal === "createChannel" ? (
        <CreateChannelModal />
      ) : (
        activeModal === "serverUsage" && <ServerUsageModal />
      )}
    </div>
  );
}
