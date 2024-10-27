import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "@rollup/plugin-wasm";

export default defineConfig({
  plugins: [react(), nodePolyfills(), wasm()],
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
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@df": path.resolve(__dirname, "./src/Shared"),
      "@mud": path.resolve(__dirname, "./src/mud"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@wallet": path.resolve(__dirname, "./src/wallet"),
      "@frontend": path.resolve(__dirname, "./src/Frontend"),
      "@backend": path.resolve(__dirname, "./src/Backend"),
    },
  },
  css: {
    devSourcemap: false,
  },
  assetsInclude: ["**/*.zkey", "**/*.wasm"],
});
