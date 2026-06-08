import { useEffect, useState, type SyntheticEvent } from "react";
import { useAuthStore, type User } from "./stores/useAuthStore";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<string>("login");
  const [authState, setAuthState] = useState<string>("idle");
  const [userData, setUserData] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);

  const save = useAuthStore((state) => state.save);

  const loginToServer = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const usernameInput = formData.get("username");
    const passwordInput = formData.get("password");

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      },
    );

    if (response.ok) {
      const responseBody = await response.json();

      const constructedUser: User = {
        id: responseBody.id,
        username: responseBody.username,
        display_name: responseBody.display_name,
        bio: responseBody.bio ?? null,
        avatar_url: responseBody.avatar_url ?? null,
        created_at: responseBody.created_at,
      };

      setUserData(constructedUser);
      setUserToken(responseBody.token);

      setAuthState("success");
    } else {
      setAuthState("error");
    }
  };

  const registerOnServer = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const usernameInput = formData.get("username");
    const passwordInput = formData.get("password");

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/auth/register/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameInput,
          display_name: usernameInput,
          password: passwordInput,
        }),
      },
    );

    if (response.ok) {
      const responseBody = await response.json();

      const constructedUser: User = {
        id: responseBody.id,
        username: responseBody.username,
        display_name: responseBody.display_name,
        bio: responseBody.bio ?? null,
        avatar_url: responseBody.avatar_url ?? null,
        created_at: responseBody.created_at,
      };

      setUserData(constructedUser);
      setUserToken(responseBody.token);

      setAuthState("success");
    } else {
      setAuthState("error");
    }
  };

  useEffect(() => {
    if (authState === "success") {
      if (!userData || !userToken) return;
      save(userData, userToken);
    }
  }, [authState, userData, userToken, save]);

  return (
    <div className="flex flex-col gap-4 w-screen h-screen justify-center items-center bg-background text-text">
      {authMode === "login" ? (
        <h1 className="text-3xl font-bold">Login</h1>
      ) : (
        <h1 className="text-3xl font-bold">Register</h1>
      )}
      <span>Login state: {authState}</span>
      <form
        className="flex flex-col gap-2 border-2 border-stroke rounded-lg p-2"
        onSubmit={authMode === "login" ? loginToServer : registerOnServer}
      >
        <input
          className="border-2 border-stroke p-2 rounded-lg"
          type="text"
          name="username"
          placeholder="username"
        />
        <input
          className="border-2 border-stroke p-2 rounded-lg"
          type="password"
          name="password"
          placeholder="password"
        />
        <button className="bg-brand-pink hover:bg-brand-pink/70 p-2 rounded-lg cursor-pointer">
          {authMode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <div className="flex flex-row gap-2 items-center w-36">
        <hr className="text-text bg-text flex-1" />
        <span className="font-bold text-trim-both">or</span>
        <hr className="text-text bg-text flex-1" />
      </div>
      <button
        className="cursor-pointer hover:underline"
        onClick={() =>
          authMode === "login" ? setAuthMode("register") : setAuthMode("login")
        }
      >
        {authMode === "login" ? "Register" : "Login"}
      </button>
    </div>
  );
}
