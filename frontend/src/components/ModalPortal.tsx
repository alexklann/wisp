import { useEffect, useRef } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useUIStore } from "../stores/useUIStore";
import { useAuthStore } from "../stores/useAuthStore";
import ServerUsageModal from "./ServerUsageModal";

export default function ModalPortal() {
  const token = useAuthStore((state) => state.token);

  const activeModal = useUIStore((state) => state.activeModal);
  const closeModal = useUIStore((state) => state.closeModal);

  const activeServerId = useChatStore((state) => state.activeServerId);
  const addChannel = useChatStore((state) => state.addChannel);

  const createServerInput = useRef<HTMLInputElement>(null);
  const createChannelInput = useRef<HTMLInputElement>(null);
  const joinServerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keypress", (e) => {
      handleKeyPress(e);
    });
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [closeModal]);

  if (activeModal === null) {
    return <></>;
  }

  const joinServer = async () => {
    if (!joinServerInput.current) return;
    if (joinServerInput.current.value.length === 0) return;

    const serverId = joinServerInput.current.value;

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/servers/${serverId}/join/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      // Maybe replace with a centralized "fetchServers" function
      // so that we don't have to reload the entire page when
      // joining a new server.
      window.location.reload();
    }
  };

  const createServer = async () => {
    if (!createServerInput.current) return;
    if (createServerInput.current.value.length === 0) return;

    const serverName = createServerInput.current.value;

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/servers/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: serverName,
        }),
      },
    );

    if (response.ok) {
      // Maybe replace with a centralized "fetchServers" function
      // so that we don't have to reload the entire page when
      // joining a new server.
      window.location.reload();
    }
  };

  const createChannel = async () => {
    if (!createChannelInput.current) return;
    if (createChannelInput.current.value.length === 0) return;

    const channelName = createChannelInput.current.value;

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/servers/${activeServerId}/channels/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: channelName,
        }),
      },
    );

    if (response.ok) {
      const responseBody = await response.json();
      addChannel(responseBody);
      closeModal();
    }
  };

  return (
    <div
      onClick={() => closeModal()}
      className="absolute inset-0 flex justify-center items-center bg-black/75 z-90"
    >
      {activeModal === "joinServer" ? (
        <div
          onClick={() => closeModal()}
          className="absolute inset-0 flex justify-center items-center bg-black/75 z-90"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex flex-col gap-2 bg-surface border-2 border-stroke rounded-lg p-4 text-white"
          >
            <span className="text-lg font-bold">Join Server</span>
            <input
              ref={joinServerInput}
              className="border-2 border-stroke p-2 rounded-lg"
              type="text"
              placeholder="Enter server id"
            />
            <button
              onClick={() => joinServer()}
              className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer w-full"
            >
              Join Server
            </button>
          </div>
        </div>
      ) : activeModal === "createServer" ? (
        <div
          onClick={() => closeModal()}
          className="absolute inset-0 flex justify-center items-center bg-black/75 z-90"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex flex-col gap-2 bg-surface border-2 border-stroke rounded-lg p-4 text-white"
          >
            <span className="text-lg font-bold">Create Server</span>
            <input
              ref={createServerInput}
              className="border-2 border-stroke p-2 rounded-lg"
              type="text"
              placeholder="Server name"
            />
            <button
              onClick={() => createServer()}
              className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer w-full"
            >
              Create Server
            </button>
          </div>
        </div>
      ) : activeModal === "createChannel" ? (
        <div
          onClick={() => closeModal()}
          className="absolute inset-0 flex justify-center items-center bg-black/75 z-90"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex flex-col gap-2 bg-surface border-2 border-stroke rounded-lg p-4 text-white"
          >
            <span className="text-lg font-bold">Create Channel</span>
            <input
              ref={createChannelInput}
              className="border-2 border-stroke p-2 rounded-lg"
              type="text"
              placeholder="Channel name"
            />
            <button
              onClick={() => createChannel()}
              className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer w-full"
            >
              Create Channel
            </button>
          </div>
        </div>
      ) : (
        activeModal === "serverUsage" && <ServerUsageModal />
      )}
    </div>
  );
}
