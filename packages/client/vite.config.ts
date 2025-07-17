/// <reference types="vitest/config" />
/* eslint-disable */

import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { ViteUserConfig } from "vitest/config.js";

const apiTarget = process.env.services__Api__http__0 || "http://localhost:7415";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tsconfigPaths(),
    // visualizer({
    //   open: false,
    //   gzipSize: true,
    //   brotliSize: true,
    //   filename: "stats.html",
    //   template: "treemap",
    // }),
  ],
  server: {
    allowedHosts: true,
    host: true, // or '0.0.0.0'
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5173,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/swagger": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/v1/swagger.json": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "terser",
    rollupOptions: {
      external: ["crypto"],
    },
  },
  envDir: "../../",
  // @ts-expect-error - Vitest config is not typed
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  } satisfies ViteUserConfig["test"],
});
