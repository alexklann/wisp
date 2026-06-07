import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const hosts = env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(",") : [];

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: hosts,
    },
  };
});
