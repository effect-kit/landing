import { createFileRoute } from "@tanstack/react-router";

import { ogResponse } from "@/lib/og/render";
import { SiteImage } from "@/lib/og/templates";
import type { SitePage } from "@/lib/og/urls";

const pages = new Set<SitePage>(["home", "redis", "emails"]);

export const Route = createFileRoute("/og/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const page = (params._splat ?? "").replace(/\.png$/, "") as SitePage;
        if (!pages.has(page)) return new Response("Not found", { status: 404 });

        return ogResponse(<SiteImage page={page} />);
      },
    },
  },
});
