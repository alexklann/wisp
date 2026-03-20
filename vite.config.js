import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

const __dirname = new URL(".", import.meta.url).pathname;

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [sveltekit()],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '${__dirname}src/lib/variables.scss' as *;`,
      },
    },
  },
}));
