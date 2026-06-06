import { useEffect, useState } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useAuthStore } from "../stores/useAuthStore";
import type Server from "../types/server";
import type Channel from "../types/channel";
import { useWebsocket } from "../hooks/useWebsocket";

export default function ServerSidebar() {
  const token = useAuthStore((state) => state.token);
  const clear = useAuthStore((state) => state.clear);

  const { socket } = useWebsocket();

  const [serverFetchStatus, setServerFetchStatus] = useState<string>("idle");
  const [channelFetchStatus, setChannelFetchStatus] = useState<string>("idle");

  const servers = useChatStore((state) => state.servers);
  const setServers = useChatStore((state) => state.setServers);

  const channels = useChatStore((state) => state.channels);
  const setChannels = useChatStore((state) => state.setChannels);
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);

  const setMessages = useChatStore((state) => state.setMessages);

  useEffect(() => {
    if (!token) return;

    if (serverFetchStatus === "idle") {
      const fetchServers = async () => {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/servers`,
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
          setServerFetchStatus("error");
        }
      };

      fetchServers();
    }
  }, [serverFetchStatus, token, setServerFetchStatus, setServers]);

  const fetchChannels = async (serverId: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/servers/${serverId}/channels`,
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
      `${import.meta.env.VITE_BACKEND_URL}/channels/${channelId}/messages`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const responseBody = await response.json();
      setMessages(responseBody);
    } else {
      console.error("Could not fetch messages");
    }
  };

  return (
    <aside className="flex flex-col gap-4 bg-surface-base text-text h-full min-w-64 border p-3 border-stroke rounded-xl">
      <div className="w-full">
        <div className="flex flex-row gap-2 p-2 w-full items-center justify-between">
          <span className="text-xs text-white/75 font-medium">Servers</span>
          <button className="cursor-pointer">+</button>
        </div>
        {serverFetchStatus === "error" && <span>Error fetching servers</span>}
        {servers &&
          servers.length > 0 &&
          servers.map((server: Server) => {
            return (
              <div
                key={`server_${server.id}`}
                onClick={() => fetchChannels(server.id)}
                className="w-full border border-stroke hover:border-brand-pink cursor-pointer rounded-lg p-2"
              >
                <span className="text-sm text-trim-both">{server.name}</span>
              </div>
            );
          })}
        <div className="flex flex-row gap-2 p-2 w-full items-center justify-between">
          <span className="text-xs text-white/75 font-medium">Channels</span>
          <button className="cursor-pointer">+</button>
        </div>

        {channelFetchStatus === "error" && <span>Error fetching channels</span>}
        {channels && channels.length > 0 ? (
          channels.map((channel: Channel) => {
            return (
              <div
                key={`server_${channel.id}`}
                onClick={() => {
                  fetchMessages(channel.id);
                  setActiveChannel(channel.id);
                  socket.send(
                    JSON.stringify({
                      type: "joinChannel",
                      channel_id: channel.id,
                    }),
                  );
                }}
                className="w-full border border-stroke hover:border-brand-pink cursor-pointer rounded-lg p-2"
              >
                <span className="text-sm text-trim-both">{channel.name}</span>
              </div>
            );
          })
        ) : (
          <span>This server has no channels</span>
        )}
      </div>
      <button onClick={() => clear()}>clear auth data</button>
    </aside>
  );
}
