import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function readBuildId() {
  try {
    return execSync("git describe --tags --long --dirty --always")
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const BUILD_ID = readBuildId();

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "build-id",
        apply: "build",
        closeBundle() {
          writeFileSync("dist/build-id.txt", BUILD_ID);
        },
      },
    ],
    define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
    server: {
      proxy: {
        "/api": "http://localhost:8000",
        "/ws": { target: "ws://localhost:8000", ws: true },
        "/uploads": "http://localhost:8000",
      },
    },
  };
});
