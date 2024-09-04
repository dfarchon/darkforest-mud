import react from "@vitejs/plugin-react";

import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    fs: {
      strict: false,
    },
  },
  build: {
    target: "es2022",
    minify: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@df": path.resolve(__dirname, "src/Shared"),
    },
  },
  css: {
    devSourcemap: false,
  },
});
