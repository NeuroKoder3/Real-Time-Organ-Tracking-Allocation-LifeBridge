import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const crypto = require("crypto");

export default defineConfig({
  // ✅ Vite project root
  root: resolve(__dirname, "client"),

  // ✅ React plugin
  plugins: [react()],

  // ✅ Define build-time environment variables
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env.VITE_API_URL || "https://api.lifebridge.online"
    ),
    crypto, // 🧩 Inject crypto polyfill for frontend builds
  },

  // ✅ Alias resolution matching tsconfig + folder structure
  resolve: {
    alias: {
      "@": resolve(__dirname, "client", "src"),
      "@shared": resolve(__dirname, "shared"),
      "@assets": resolve(__dirname, "attached_assets"), // 💡 Make sure this path exists!
    },
  },

  // ✅ Build output config (dist folder relative to /client)
  build: {
    outDir: "dist",
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

  // ✅ Optimization hints
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
  },

  // ✅ Dev server config for full-stack proxying
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:5000", // 🔁 Backend server for demo login
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"], // Prevent .env/.git exposure
    },
  },
});
