import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    root: resolve(__dirname, "client"),

    plugins: [react()],

    // ✅ Only VITE_API_URL is needed
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL),
    },

    resolve: {
      alias: {
        "@": resolve(__dirname, "client", "src"),
        "@shared": resolve(__dirname, "shared"),
        "@assets": resolve(__dirname, "attached_assets"),
      },
    },

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
  };
});
