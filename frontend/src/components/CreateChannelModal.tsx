import { useRef } from "react";
import { useChatStore } from "../stores/useChatStore";
import Modal from "./Modal";
import ModalDescription from "./Modal/components/ModalDescription";
import ModalHeader from "./Modal/components/ModalHeader";
import ModalTitle from "./Modal/components/ModalTitle";
import { useUIStore } from "../stores/useUIStore";
import { useAuthStore } from "../stores/useAuthStore";

export default function CreateChannelModal() {
  const token = useAuthStore((state) => state.token);

  const activeServerId = useChatStore((state) => state.activeServerId);
  const addChannel = useChatStore((state) => state.addChannel);

  const closeModal = useUIStore((state) => state.closeModal);

  const createChannelInput = useRef<HTMLInputElement>(null);

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
    <Modal>
      <ModalHeader>
        <ModalTitle>Create Channel</ModalTitle>
        <ModalDescription>Create a channel for this server</ModalDescription>
      </ModalHeader>

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
    </Modal>
  );
}
