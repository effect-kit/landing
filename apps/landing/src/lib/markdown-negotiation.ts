import { createMiddleware } from "@tanstack/react-start";

import { isMarkdownPreferred } from "fumadocs-core/negotiation";

import { landingMarkdown, landingPaths } from "@/content/landing-markdown";

import { markdownHeaders } from "./agent-headers";
import { getChangelogPackage } from "./packages";
import { docsLlms, source } from "./source";

/**
 * Serves the Markdown version of a landing or docs page when the client asks for `text/markdown`, so agents
 * get clean text from the same URL people read. Everything else passes through.
 */
export const markdownNegotiation = createMiddleware({ type: "request" }).server(
  async ({ request, next }) => {
    const { pathname } = new URL(request.url);

    if (pathname.endsWith(".md") || !isMarkdownPreferred(request)) return next();

    const landing = landingPaths[pathname];

    if (landing) return new Response(landingMarkdown(landing), { headers: markdownHeaders });

    const isDocs = pathname === "/docs" || pathname.startsWith("/docs/");

    if (!isDocs) return next();

    const slugs = pathname.slice("/docs".length).split("/").filter(Boolean);
    const changelog = getChangelogPackage(slugs);

    if (changelog) {
      const { changelogMarkdown } = await import("./changelog.server");
      return new Response(await changelogMarkdown(changelog), { headers: markdownHeaders });
    }

    const page = source.getPage(slugs.length > 0 ? slugs : ["redis"]);

    if (!page) return next();

    return new Response(await docsLlms.page(page), { headers: markdownHeaders });
  },
);
