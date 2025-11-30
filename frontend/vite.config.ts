import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolveBasePath = () => {
  const rawBase = process.env.VITE_BASE_PATH ?? "/";
  return rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
};

const basePath = resolveBasePath();

export default defineConfig({
  base: basePath,
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared")
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Gestionale Rilevamenti Operai",
        short_name: "Talete",
        description: "PWA per la gestione dei rilevamenti degli operai",
        theme_color: "#1c7ed6",
        background_color: "#1c7ed6",
        display: "standalone",
        start_url: basePath,
        scope: basePath,
        icons: [
          {
            src: `${basePath}icons/icon-192.svg`,
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: `${basePath}icons/icon-512.svg`,
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, "..")]
    },
    proxy: {
      "/api": "http://localhost:4000"
    }
  }
});
