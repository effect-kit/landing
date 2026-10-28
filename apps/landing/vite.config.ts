import { readdirSync } from "node:fs";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { defineConfig } from "vite";

// Package docs are only linked from the picker popover, so seed the crawler with each one.
const packageDocs = readdirSync("content/docs", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({ path: `/docs/${entry.name}` }));

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    fumadocsMdx(),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
      pages: packageDocs,
    }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
