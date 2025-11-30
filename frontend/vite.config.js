import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var resolveBasePath = function () {
    var _a;
    var rawBase = (_a = process.env.VITE_BASE_PATH) !== null && _a !== void 0 ? _a : "/";
    return rawBase.endsWith("/") ? rawBase : "".concat(rawBase, "/");
};
var basePath = resolveBasePath();
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
                        src: "".concat(basePath, "icons/icon-192.svg"),
                        sizes: "192x192",
                        type: "image/svg+xml"
                    },
                    {
                        src: "".concat(basePath, "icons/icon-512.svg"),
                        sizes: "512x512",
                        type: "image/svg+xml"
                    }
                ]
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: function (_a) {
                            var request = _a.request;
                            return request.destination === "image";
                        },
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
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.pathname.startsWith("/api");
                        },
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
