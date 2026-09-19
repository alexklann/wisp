import Modal from "./Modal";
import ModalDescription from "./Modal/components/ModalDescription";
import ModalHeader from "./Modal/components/ModalHeader";
import ModalTitle from "./Modal/components/ModalTitle";
import { useAuthStore } from "../stores/useAuthStore";
import { useRef, useState, type SyntheticEvent } from "react";
import SpinnerIcon from "../icons/SpinnerIcon";
import { twMerge } from "tailwind-merge";
import PaperclipIcon from "../icons/PaperclipIcon";

export default function UserEditModal() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const filePicker = useRef<HTMLInputElement>(null);

  const [fetchStatus, setFetchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [avatarStatus, setAvatarStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const onFormSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFetchStatus("loading");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username")
    const display_name = formData.get("display_name")
    const bio = formData.get("bio")
    const avatar = formData.get("avatar");

    let avatar_url = null;

    if (avatar) {
      setAvatarStatus("loading");

      const fileFormData = new FormData();
      fileFormData.append("file", avatar);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/upload/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: fileFormData
        },
      );

      if (response.ok) {
        const responseBody = await response.json();
        avatar_url = `${import.meta.env.VITE_BACKEND_URL}${responseBody.url}`;
        setAvatarStatus("success");
      } else {
        console.log(response.text);
        setAvatarStatus("error");
        setFetchStatus("error");
        return;
      }
    }

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/users/me/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          display_name,
          bio,
          avatar_url,
        })
      },
    );

    if (response.ok) {
      const responseBody = await response.json();
      setUser(responseBody);
      location.reload(); // Not sure if there is even a way to avoid this
      setFetchStatus("success");
    } else {
      console.log(response.text);
      setFetchStatus("error");
    }
  };

  return (
    <Modal>
      <ModalHeader>
        <ModalTitle>Your Profile</ModalTitle>
        <ModalDescription>Edit your user profile</ModalDescription>
      </ModalHeader>
      {user && (
        <div className="flex flex-col gap-2">
          <form onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              setAvatarUrl(reader.result as string);
            };
            reader.onerror = () => {
              console.error("Failed to read file:", reader.error);
            };
            reader.readAsDataURL(file);
          }} onSubmit={onFormSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-row gap-8">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (filePicker.current) {
                    filePicker.current.showPicker();
                  }
                }}
                disabled={avatarStatus === "loading"}
                type="button"
                title="Upload image"
                className="relative group rounded-full overflow-hidden border-2 border-text/20 cursor-pointer w-fit h-fit">
                <input name="avatar" ref={filePicker} type="file" className="hidden" />
                <div className={twMerge(
                  "absolute justify-center items-center inset-0",
                  avatarStatus === "idle" ? "hidden group-hover:flex bg-black/50" : "flex bg-black/50"
                )}>
                  {avatarStatus === "loading" ? (
                    <SpinnerIcon className="h-12 w-12 animate-spin" />
                  ) : avatarStatus === "idle" ? (
                    <PaperclipIcon className="h-12 w-12" />
                  ) : avatarStatus === "success" ? (
                    <SpinnerIcon className="h-12 w-12 animate-spin" />
                  ) : (
                    <span className="text-2xl font-bold text-text">
                      ?
                    </span>
                  )}
                </div>
                <img src={avatarUrl ?? user.avatar_url!} className="w-32! aspect-square" />
              </button>
              <div className="flex flex-col gap-2 flex-1">
                <label className="flex flex-col flex-1">
                  <span className="text-text text-sm">Username</span>
                  <input
                    className="border-2 border-stroke p-2 rounded-lg w-full"
                    type="text"
                    name="username"
                    placeholder="Username"
                    defaultValue={user.username} />
                </label>
                <label className="flex flex-col flex-1">
                  <span className="text-text text-sm">Display Name</span>
                  <input
                    className="border-2 border-stroke p-2 rounded-lg w-full"
                    type="text"
                    name="display_name"
                    placeholder="Display Name"
                    defaultValue={user.display_name} />
                </label>
              </div>

            </div>
            <label className="flex flex-col flex-1">
              <span className="text-text text-sm">Bio</span>
              <textarea
                className="border-2 border-stroke p-2 rounded-lg w-full"
                rows={4}
                name="bio"
                placeholder="Bio (not used yet)"
                defaultValue={user.bio ?? ""} />
            </label>
            <div className="flex flex-row items-center">
              {fetchStatus === "loading" && (
                <div className="flex flex-row items-center gap-2">
                  <SpinnerIcon className="h-6 w-6 animate-spin" />
                  <span>Applying...</span>
                </div>
              )}
              <button type="submit" disabled={fetchStatus === "loading"} className={twMerge(
                "ml-auto p-2 rounded-lg cursor-pointer w-32",
                fetchStatus === "loading" ? "bg-gray-600 cursor-not-allowed" : "bg-brand-pink hover:bg-brand-pink/70"
              )}>Apply</button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
