import { useRef } from "react";
import Modal from "./Modal";
import ModalDescription from "./Modal/components/ModalDescription";
import ModalHeader from "./Modal/components/ModalHeader";
import ModalTitle from "./Modal/components/ModalTitle";
import { useAuthStore } from "../stores/useAuthStore";

export default function JoinServerModal() {
  const token = useAuthStore((state) => state.token);

  const joinServerInput = useRef<HTMLInputElement>(null);

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

  return (
    <Modal>
      <ModalHeader>
        <ModalTitle>Join Server</ModalTitle>
        <ModalDescription>Join a server</ModalDescription>
      </ModalHeader>

      <input
        ref={joinServerInput}
        className="border-2 border-stroke p-2 rounded-lg"
        type="text"
        placeholder="Server id"
      />
      <button
        onClick={() => joinServer()}
        className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer w-full"
      >
        Join Server
      </button>
    </Modal>
  );
}
