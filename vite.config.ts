import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tailwindcss from "tailwindcss";
import pkg from "./package.json";
import { execSync } from "child_process";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    dedupe: [...Object.keys(pkg.dependencies)],
  },
  plugins: [
    svgr(),
    react(),
    nodePolyfills({
      include: ["crypto", "stream"],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  define: {
    "process.env.REACT_APP_GIT_SHA": JSON.stringify(
      execSync("git rev-parse --short HEAD").toString().trim()
    ),
  },
});
