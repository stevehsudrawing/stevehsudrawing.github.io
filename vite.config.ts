import vue from "@vitejs/plugin-vue";
import { BootstrapVueNextResolver } from "bootstrap-vue-next/resolvers";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";
import { contentInjectionPlugin } from "./build/content-injection-plugin";
import { headTagsPlugin } from "./build/head-tags-plugin";
import { llmsTxtPlugin } from "./build/llms-txt-plugin";
import { minifyPlugin } from "./build/minify-plugin";
import { sitemapPlugin } from "./build/sitemap-plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  root: resolve(__dirname, "src"),

  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
      dts: true,
      directives: true,
    }),
    contentInjectionPlugin(),
    headTagsPlugin(),
    minifyPlugin(),
    sitemapPlugin(),
    llmsTxtPlugin(),
  ],

  server: {
    port: 5173,
    open: false,
  },

  publicDir: resolve(__dirname, "public"),

  build: {
    target: "es2015",
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src", "index.html"),
        about: resolve(__dirname, "src", "about.html"),
        "artworks-and-videos": resolve(
          __dirname,
          "src",
          "artworks-and-videos.html",
        ),
        gallery: resolve(__dirname, "src", "gallery.html"),
        "blogs-and-sponsor": resolve(
          __dirname,
          "src",
          "blogs-and-sponsor.html",
        ),
        chatting: resolve(__dirname, "src", "chatting.html"),
        softwares: resolve(__dirname, "src", "softwares.html"),
        copyright: resolve(__dirname, "src", "copyright-notice.html"),
        worldview: resolve(__dirname, "src", "worldview.html"),
      },
    },
  },
});
