import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { headTagsPlugin } from "./build/head-tags-plugin.js";
import { contentInjectionPlugin } from "./build/content-injection-plugin.js";
import { minifyPlugin } from "./build/minify-plugin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  root: resolve(__dirname, "src"),

  plugins: [contentInjectionPlugin(), headTagsPlugin(), minifyPlugin()],

  server: {
    port: 5173,
    open: true,
  },

  publicDir: resolve(__dirname, "public"),

  build: {
    target: 'es2015',
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src", "index.html"),
        about: resolve(__dirname, "src", "about.html"),
        "artworks-and-videos": resolve(__dirname, "src", "artworks-and-videos.html"),
        "blogs-and-sponsor": resolve(__dirname, "src", "blogs-and-sponsor.html"),
        chatting: resolve(__dirname, "src", "chatting.html"),
        softwares: resolve(__dirname, "src", "softwares.html"),
        "404": resolve(__dirname, "src", "404.html"),
      },
    },
  },
});
