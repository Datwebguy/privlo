import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const zamaCspHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.zama.org; connect-src 'self' https: wss: https://cdn.zama.org https://relayer.testnet.zama.org; worker-src 'self' blob:;",
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "wagmi/actions": path.resolve(__dirname, "src/shims/wagmi-actions.ts"),
    },
  },
  server: {
    port: 5173,
    headers: zamaCspHeaders,
  },
  preview: {
    headers: zamaCspHeaders,
  },
});