import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const apiProxy = {
  "/api": {
    target: "http://localhost:8080",
    changeOrigin: true,
  },
  "/v3": {
    target: "http://localhost:8080",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: [
        "icons/agrogestor-icon.svg",
        "icons/apple-touch-icon-180x180.png",
      ],
      manifest: {
        name: "AgroGestor",
        short_name: "AgroGestor",
        description:
          "Sistema de gestão rural familiar para plantios, custos e operações da propriedade.",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        theme_color: "#367c2b",
        background_color: "#ffffff",
        lang: "pt-BR",
        icons: [
          {
            src: "/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
