import Modal from "./Modal";
import ModalDescription from "./Modal/components/ModalDescription";
import ModalHeader from "./Modal/components/ModalHeader";
import ModalTitle from "./Modal/components/ModalTitle";
import { useAuthStore } from "../stores/useAuthStore";
import { useState, type SyntheticEvent } from "react";
import SpinnerIcon from "../icons/SpinnerIcon";
import { twMerge } from "tailwind-merge";

export default function UserEditModal() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [fetchStatus, setFetchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const onFormSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFetchStatus("loading");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username")
    const display_name = formData.get("display_name")
    const bio = formData.get("bio")


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
          bio
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
          <form onSubmit={onFormSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-row gap-4">
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
