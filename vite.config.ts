import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // relative asset paths — required for Electron loadFile (file://)
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".e2b.app"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
