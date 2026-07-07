import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "wagmi/actions": path.resolve(__dirname, "src/shims/wagmi-actions.ts"),
    },
  },
  server: { port: 5173 },
});