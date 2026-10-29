import { readdirSync } from "node:fs";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fumadocsMdx } from "fumadocs-mdx/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// On Vercel, prerendered pages are served as static files before the server runs, so the
// content-negotiation middleware never sees them. These routes send `Accept: text/markdown`
// requests to the prerendered `.md` version first.
const acceptsMarkdown = [{ type: "header", key: "accept", value: "(?:.*[,\\s])?text/markdown.*" }];
const markdownRoutes = [
  { src: "^/$", has: acceptsMarkdown, dest: "/index.md", headers: { Vary: "Accept" } },
  { src: "^/(redis|emails)/?$", has: acceptsMarkdown, dest: "/$1.md", headers: { Vary: "Accept" } },
  {
    src: "^/docs/((?!.*\\.md$).+?)/?$",
    has: acceptsMarkdown,
    dest: "/docs/$1.md",
    headers: { Vary: "Accept" },
  },
];

// Package docs are only linked from the picker popover, so seed the crawler with each one,
// along with their Markdown versions for agents.
const packageDocs = readdirSync("content/docs", { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? [{ path: `/docs/${entry.name}` }, { path: `/docs/${entry.name}.md` }] : [],
);

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
      pages: [
        ...packageDocs,
        { path: "/sitemap.xml" },
        { path: "/robots.txt" },
        { path: "/llms.txt" },
        { path: "/index.md" },
        { path: "/redis.md" },
        { path: "/emails.md" },
        { path: "/llms-full.txt" },
      ],
    }),
    // Nitro builds the server for the host it detects (Vercel when deployed there).
    nitro({ vercel: { config: { version: 3, routes: markdownRoutes } } }),
    react(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
