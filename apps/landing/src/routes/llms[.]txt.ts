import { createFileRoute } from "@tanstack/react-router";

import { textHeaders } from "@/lib/agent-headers";
import { countAgentRead } from "@/lib/analytics/agent";
import { getPageMarkdownUrl } from "@/lib/shared";
import { absolute, site } from "@/lib/site";
import { source } from "@/lib/source";

/** Docs pages grouped by package, each linking to its Markdown version. */
function docsIndex() {
  const groups = new Map<string, string[]>();

  for (const page of source.getPages()) {
    const pkg = page.slugs[0] ?? "docs";
    const line = `- [${page.data.title}](${absolute(getPageMarkdownUrl(page))}): ${page.data.description ?? ""}`;

    groups.set(pkg, [...(groups.get(pkg) ?? []), line.trimEnd()]);
  }

  return [...groups]
    .map(
      ([pkg, lines]) =>
        `## ${pkg.charAt(0).toUpperCase()}${pkg.slice(1)} docs\n\n${lines.join("\n")}`,
    )
    .join("\n\n");
}

/** The llms.txt index: what Effect Kit is, its pages, and every docs page. */
export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const body = [
          `# ${site.name}`,
          `> ${site.description}`,
          "## Pages",
          [
            `- [Home](${absolute("/index.md")}): what Effect Kit is and how it fits an Effect app.`,
            `- [Redis for Effect](${absolute("/redis.md")}): a native Redis client for Effect.`,
            `- [Email for Effect](${absolute("/emails.md")}): one Email service for 16 providers.`,
            `- [Full docs as one file](${absolute("/llms-full.txt")})`,
          ].join("\n"),
          docsIndex(),
        ].join("\n\n");

        await countAgentRead(request, "llms");

        return new Response(body, { headers: textHeaders });
      },
    },
  },
});
