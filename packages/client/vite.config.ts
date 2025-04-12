import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePath from "node:path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "@rollup/plugin-wasm";

const dirname = process.cwd();

function resolvePath(path: string) {
  return nodePath.resolve(`${dirname}`, path);
}

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
      "@df": resolvePath("./src/Shared"),
      "@mud": resolvePath("./src/mud"),
      "@hooks": resolvePath("./src/hooks"),
      "@wallet": resolvePath("./src/wallet"),
      "@frontend": resolvePath("./src/Frontend"),
      "@backend": resolvePath("./src/Backend"),
      "@bluepill": resolvePath("./src/BluePill"),
    },
  },
  css: {
    devSourcemap: false,
  },
  assetsInclude: ["**/*.zkey", "**/*.wasm"],
  define: {
    "import.meta.env.DEV": false,
  },
});
