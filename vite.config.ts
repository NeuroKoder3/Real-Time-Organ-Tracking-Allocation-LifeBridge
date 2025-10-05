import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const crypto = require("crypto");

export default defineConfig({
  // ✅ Root stays in /client for Vite
  root: resolve(__dirname, "client"),

  plugins: [react()],

  // ✅ Hardcode env at build time
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env.VITE_API_URL || "https://api.lifebridge.online"
    ),
    crypto, // allow crypto polyfill during build
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "client", "src"),
      "@shared": resolve(__dirname, "shared"),
      "@assets": resolve(__dirname, "attached_assets"),
    },
  },

  build: {
    // ✅ Output inside client/dist (what server expects)
    outDir: "dist", // relative to /client root → client/dist
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks: {
          react: ["react", "react-dom", "react/jsx-runtime"],
        },
      },
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },

  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
