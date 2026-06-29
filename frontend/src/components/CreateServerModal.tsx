import { useRef } from "react";
import Modal from "./Modal";
import ModalDescription from "./Modal/components/ModalDescription";
import ModalHeader from "./Modal/components/ModalHeader";
import ModalTitle from "./Modal/components/ModalTitle";
import { useAuthStore } from "../stores/useAuthStore";

export default function CreateServerModal() {
  const token = useAuthStore((state) => state.token);

  const createServerInput = useRef<HTMLInputElement>(null);

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

  return (
    <Modal>
      <ModalHeader>
        <ModalTitle>Create Server</ModalTitle>
        <ModalDescription>Create a server</ModalDescription>
      </ModalHeader>

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
    </Modal>
  );
}
