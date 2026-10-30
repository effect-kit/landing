import { createFileRoute } from "@tanstack/react-router";

import { type LandingPage, landingMarkdown } from "@/content/landing-markdown";
import { markdownHeaders } from "@/lib/agent-headers";
import { countAgentRead } from "@/lib/analytics/agent";
import { blogIndexMarkdown } from "@/lib/blog/markdown";

const pages = new Set<string>(["index", "redis", "emails"]);

/** The landing pages and the blog index as Markdown: `/index.md`, `/redis.md`, `/blog.md`. */
export const Route = createFileRoute("/{$}.md")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const page = params._splat ?? "";

        if (page === "blog") {
          await countAgentRead(request, "md");
          return new Response(await blogIndexMarkdown(), { headers: markdownHeaders });
        }

        if (!pages.has(page)) return new Response("Not found", { status: 404 });

        await countAgentRead(request, "md");

        return new Response(landingMarkdown(page as LandingPage), { headers: markdownHeaders });
      },
    },
  },
});
