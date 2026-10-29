import { createFileRoute } from "@tanstack/react-router";

import { markdownHeaders } from "@/lib/agent-headers";
import { docsLlms, source } from "@/lib/source";

/** A docs page as Markdown: `/docs/redis.md`, `/docs/index.md` for the docs root. */
export const Route = createFileRoute("/docs/{$}.md")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slugs = (params._splat ?? "").split("/").filter(Boolean);
        const page = source.getPage(slugs[0] === "index" && slugs.length === 1 ? [] : slugs);

        if (!page) return new Response("Not found", { status: 404 });

        return new Response(await docsLlms.page(page), { headers: markdownHeaders });
      },
    },
  },
});
