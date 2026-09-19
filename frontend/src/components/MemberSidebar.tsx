import { useEffect, useState } from "react";
import { useChatStore } from "../stores/useChatStore";
import { useAuthStore } from "../stores/useAuthStore";
import { useUIStore } from "../stores/useUIStore";
import CloseIcon from "../icons/CloseIcon";
// import SpinnerIcon from "../icons/SpinnerIcon";
import MessageAvatar from "./MessageItem/components/MessageAvatar";

interface Member {
  user_id: string;
  server_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  role: string;
  online: boolean;
  joined_at: string;
}

export default function MemberSidebar() {
  const token = useAuthStore((state) => state.token);

  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverMembers, setServerMembers] = useState<Member[]>([]);

  const activeServerId = useChatStore((state) => state.activeServerId);

  const isMemberSidebarOpen = useUIStore((state) => state.isMemberSidebarOpen);
  const setIsMemberSidebarOpen = useUIStore((state) => state.setIsMemberSidebarOpen);

  const fetchMembers = async () => {
    setFetchStatus("loading");

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/servers/${activeServerId}/members/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const responseBody: Member[] = await response.json();

      setServerMembers(responseBody);
      setFetchStatus("success");
    } else {
      setFetchStatus("error");
    }
  };

  useEffect(() => {
    if (activeServerId === null) return;

    fetchMembers();
    const interval = setInterval(async () => {
      if (document.hasFocus()) {
        await fetchMembers();
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [activeServerId])


  return (
    <aside
      className={`z-20 fixed m-3 inset-0 md:m-0 md:translate-x-0 left-0 md:relative flex flex-col gap-2 transform transition-transform duration-300 ease-in-out bg-surface-base text-text min-w-64 border p-3 border-stroke rounded-xl ${isMemberSidebarOpen ? "translate-x-0" : "translate-x-[calc(100%+12px)]"}`}
    >
      <div className="w-full">
        <div className="md:hidden bg-surface rounded-lg border-stroke border-2 p-2">
          <button
            onClick={() => setIsMemberSidebarOpen(false)}
            className="min-w-10 flex items-center justify-center aspect-square bg-surface-base hover:bg-surface border border-stroke rounded-lg cursor-pointer"
          >
            <CloseIcon className="text-text" />
          </button>
        </div>

        <div className="p-2 w-full flex flex-col gap-4">
          {fetchStatus === "error" && (
            <span>Error fetching members</span>
          )}

          {/* Online Users */}
          <div className="flex flex-col gap-2">
            <span className="w-full text-xs text-white/75 font-medium">Online</span>
            {fetchStatus !== "error"
              && serverMembers.length > 0 && (
                serverMembers.map((member) => (
                  member.online && (
                    <div className="flex flex-row items-center gap-2" key={`member_${member.user_id}`}>
                      <MessageAvatar className="w-6 h-6" avatarUrl={member.avatar_url} />
                      <span>{member.display_name}</span>
                    </div>
                  )
                ))
              )}
          </div>

          {/* Offline Users */}
          <div className="flex flex-col gap-2">
            <span className="w-full text-xs text-white/75 font-medium">Offline</span>
            {fetchStatus !== "error"
              && serverMembers.length > 0 && (
                serverMembers.map((member) => (
                  !member.online && (
                    <div className="flex flex-row items-center gap-2" key={`member_${member.user_id}`}>
                      <MessageAvatar className="w-6 h-6" avatarUrl={member.avatar_url} />
                      <span>{member.display_name}</span>
                    </div>
                  )
                ))
              )}
          </div>
        </div>
      </div>
      {/* Rather annoying, so that's why it's disabled for now */}
      {/* <button title="Updated User List" onClick={async () => fetchMembers()} className="flex flex-row items-center justify-between mt-auto cursor-pointer">
        {fetchStatus === "loading" ? (
          <div className="flex flex-row gap-2 items-center">
            <SpinnerIcon className="text-text/40 animate-spin h-4 w-4" />
            <span className="text-sm text-center text-text/20">
              Updating...
            </span>
          </div>
        ) : (
          <span className="text-sm text-center text-text/20">
            Last updated: just now
          </span>
        )}
      </button> */}
    </aside>
  );
}
