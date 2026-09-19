import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import Modal from "./Modal";
import ModalDescription from "./Modal/components/ModalDescription";
import ModalHeader from "./Modal/components/ModalHeader";
import ModalTitle from "./Modal/components/ModalTitle";
import { useAuthStore } from "../stores/useAuthStore";

interface ModalProps {
  setDisplayingModal: Dispatch<SetStateAction<"create" | "join">>
}

function JoinServerModal({ setDisplayingModal }: ModalProps) {
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

      <div className="flex flex-row gap-2 items-center w-full">
        <input
          ref={joinServerInput}
          className="border-2 border-stroke p-2 rounded-lg flex-1"
          type="text"
          placeholder="Server ID"
        />
        <button
          onClick={() => joinServer()}
          className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer w-10"
        >
          +
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <div className="w-full flex flex-row justify-center">
          <span className="text-xl font-bold">Creating a server?</span>
        </div>
        <button
          onClick={() => setDisplayingModal("create")}
          className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer w-full"
        >
          Create Server
        </button>
      </div>
    </Modal>
  )
}

function CreateServerModal({ setDisplayingModal }: ModalProps) {
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

      <div className="flex flex-row gap-2 items-center w-full">
        <input
          ref={createServerInput}
          className="border-2 border-stroke p-2 rounded-lg flex-1"
          type="text"
          placeholder="Server Name"
        />
        <button
          onClick={() => createServer()}
          className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer w-10"
        >
          +
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <div className="w-full flex flex-row justify-center">
          <span className="text-xl font-bold">Joining a server?</span>
        </div>
        <button
          onClick={() => setDisplayingModal("join")}
          className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer w-full"
        >
          Join Server
        </button>
      </div>
    </Modal>
  )
}

export default function CreateOrJoinServerModal() {
  const [displayingModal, setDisplayingModal] = useState<"create" | "join">("create");

  if (displayingModal === "create") {
    return (
      <CreateServerModal setDisplayingModal={setDisplayingModal} />
    );
  } else {
    return (
      <JoinServerModal setDisplayingModal={setDisplayingModal} />
    )
  }


}
