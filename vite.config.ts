import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ngrokHost = process.env.VITE_NGROK_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    proxy: {
      "/api/instagram": {
        target: "https://www.instagram.com",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api\/instagram/, "/api/v1"),
        headers: {
          "X-IG-App-ID": "936619743392459",
          "User-Agent": "Instagram 219.0.0.12.117 Android",
        },
      },
    },
    ...(ngrokHost
      ? {
          allowedHosts: [ngrokHost, ".ngrok-free.app"],
          hmr: {
            host: ngrokHost,
            protocol: "wss",
            clientPort: 443,
          },
        }
      : {
          hmr: true,
        }),
  },
});
