import { createFileRoute } from "@tanstack/react-router";

import { type LandingPage, landingMarkdown } from "@/content/landing-markdown";
import { markdownHeaders } from "@/lib/agent-headers";

const pages = new Set<string>(["index", "redis", "emails"]);

/** The landing pages as Markdown: `/index.md`, `/redis.md`, `/emails.md`. */
export const Route = createFileRoute("/{$}.md")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const page = params._splat ?? "";

        if (!pages.has(page)) return new Response("Not found", { status: 404 });

        return new Response(landingMarkdown(page as LandingPage), { headers: markdownHeaders });
      },
    },
  },
});
