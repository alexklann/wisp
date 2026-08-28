import { useEffect, useState } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useAuthStore } from "../stores/useAuthStore";
import type Server from "../types/server";
import type Channel from "../types/channel";
import { useWebsocket } from "../hooks/useWebsocket";
import { useUIStore } from "../stores/useUIStore";
import CloseIcon from "../icons/CloseIcon";
import HDDIcon from "../icons/HDDIcon";
import BaseActionButton from "./BaseActionButton";

export default function ServerSidebar() {
  const token = useAuthStore((state) => state.token);

  const { socket } = useWebsocket();

  const [serverFetchStatus, setServerFetchStatus] = useState<string>("idle");
  const [channelFetchStatus, setChannelFetchStatus] = useState<string>("idle");

  const clear = useAuthStore((state) => state.clear);

  const servers = useChatStore((state) => state.servers);
  const setServers = useChatStore((state) => state.setServers);
  const activeServerId = useChatStore((state) => state.activeServerId);
  const setActiveServer = useChatStore((state) => state.setActiveServer);

  const channels = useChatStore((state) => state.channels);
  const setChannels = useChatStore((state) => state.setChannels);
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);
  const activeChannelId = useChatStore((state) => state.activeChannelId);

  const setMessages = useChatStore((state) => state.setMessages);

  const openModal = useUIStore((state) => state.openModal);
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const setIsSidebarOpen = useUIStore((state) => state.setIsSidebarOpen);

  useEffect(() => {
    if (!token) return;

    if (serverFetchStatus === "idle") {
      const fetchServers = async () => {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/servers/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const responseBody = await response.json();
          setServers(responseBody);
          setServerFetchStatus("success");
        } else {
          if (response.status === 401) {
            clear();
            location.reload();
          }
          setServerFetchStatus("error");
        }
      };

      fetchServers();
    }
  }, [serverFetchStatus, token, setServerFetchStatus, setServers, clear]);

  const fetchChannels = async (serverId: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/servers/${serverId}/channels/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const responseBody = await response.json();
      setChannels(responseBody);
      setChannelFetchStatus("success");
    } else {
      setChannelFetchStatus("error");
    }
  };

  const fetchMessages = async (channelId: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/channels/${channelId}/messages/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const responseBody = await response.json();
      console.log(responseBody);
      setMessages(responseBody);
    } else {
      console.error("Could not fetch messages");
    }
  };

  return (
    <aside
      className={`z-20 fixed m-3 inset-0 md:m-0 md:translate-x-0 left-0 md:relative flex flex-col gap-2 transform transition-transform duration-300 ease-in-out bg-surface-base text-text min-w-64 border p-3 border-stroke rounded-xl ${isSidebarOpen ? "translate-x-0" : "translate-x-[calc(-100%-12px)]"}`}
    >
      <div className="w-full">
        <div className="md:hidden bg-surface rounded-lg border-stroke border-2 p-2">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
          >
            <CloseIcon className="text-text" />
          </button>
        </div>
        <div className="flex flex-row gap-2 p-2 w-full items-center justify-between">
          <span className="text-xs text-white/75 font-medium">Servers</span>
          <button
            onClick={() => openModal("createServer")}
            className="cursor-pointer"
          >
            +
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {serverFetchStatus === "error" && <span>Error fetching servers</span>}
          {servers &&
            servers.length > 0 &&
            servers.map((server: Server) => {
              return (
                <div
                  key={`server_${server.id}`}
                  onClick={() => {
                    fetchChannels(server.id);
                    setActiveServer(server.id);
                  }}
                  className={`w-full border hover:border-brand-pink cursor-pointer rounded-lg p-2 ${activeServerId === server.id ? "border-brand-pink" : "border-stroke"}`}
                >
                  <span className="text-sm text-trim-both">{server.name}</span>
                </div>
              );
            })}
        </div>
        <button
          className="w-full text-center py-4 hover:underline cursor-pointer"
          onClick={() => openModal("joinServer")}
        >
          Join Server
        </button>
        <div className="flex flex-row gap-2 p-2 w-full items-center justify-between">
          <span className="text-xs text-white/75 font-medium">Channels</span>
          {activeServerId !== null && (
            <button
              onClick={() => openModal("createChannel")}
              className="cursor-pointer"
            >
              +
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {channelFetchStatus === "error" && (
            <span>Error fetching channels</span>
          )}
          {channels && channels.length > 0 ? (
            channels.map((channel: Channel) => {
              return (
                <div
                  key={`server_${channel.id}`}
                  onClick={() => {
                    if (socket === null) return;

                    fetchMessages(channel.id);
                    setActiveChannel(channel.id);
                    setIsSidebarOpen(false);

                    socket.send(
                      JSON.stringify({
                        type: "joinChannel",
                        channel_id: channel.id,
                      }),
                    );
                  }}
                  className={`w-full border hover:border-brand-pink cursor-pointer rounded-lg p-2 ${activeChannelId === channel.id ? "border-brand-pink" : "border-stroke"}`}
                >
                  <span className="text-sm text-trim-both">{channel.name}</span>
                </div>
              );
            })
          ) : (
            <span>This server has no channels</span>
          )}
        </div>
      </div>
      <div className="flex flex-row items-end mt-auto">
        <span className="w-full text-sm text-text/20 font-bold">
          Wisp 260828-01
        </span>
        <BaseActionButton
          title="Server Usage"
          onClick={() => openModal("serverUsage")}
        >
          <HDDIcon className="text-text w-[75%] aspect-square" />
        </BaseActionButton>
      </div>
    </aside>
  );
}
