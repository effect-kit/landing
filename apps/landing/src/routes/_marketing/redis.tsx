import { createFileRoute } from "@tanstack/react-router";

import { apiTourSnippetIds } from "@/features/redis/api-tour";
import { RedisPage } from "@/features/redis/redis-page";
import { runtimeSnippetIds } from "@/features/redis/runtime-switch";
import { Playground, playgroundExampleIds, visualCode } from "@/features/visual";
import { keyedSnippets } from "@/lib/magic";
import { siteImageUrl } from "@/lib/og/urls";
import { breadcrumbLd, packageLd, pageTitle, seo, webPageLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_marketing/redis")({
  loader: async () => {
    const [tokens, visual] = await Promise.all([
      keyedSnippets({ data: [...apiTourSnippetIds, ...runtimeSnippetIds] }),
      visualCode({ data: playgroundExampleIds(["redis"]) }),
    ]);

    return { tokens, visual };
  },
  head: () =>
    seo({
      title: "Redis for Effect",
      description:
        "A native Redis client for Effect with typed commands, scoped connections, pipelines, transactions, Pub/Sub and Streams. Runs on Node.js, Bun and Upstash HTTP.",
      path: "/redis",
      image: {
        url: siteImageUrl("redis"),
        alt: "Redis for Effect: one client for Redis, Valkey, Dragonfly, Upstash and more",
      },
      keywords: [
        "Redis",
        "Effect",
        "Effect-TS",
        "Redis client",
        "TypeScript",
        "Valkey",
        "Dragonfly",
        "Upstash",
        "Redis Cluster",
        "Node.js",
        "Bun",
      ],
      jsonLd: [
        packageLd({
          name: "Effect Kit Redis",
          npm: "@effect-kit/redis",
          description:
            "A native Redis client for Effect with typed commands, scoped connections, pipelines, transactions, Pub/Sub and Streams. Runs on Node.js, Bun and Upstash HTTP.",
          path: "/redis",
          repository: "https://github.com/effect-kit/redis",
          image: siteImageUrl("redis"),
          keywords: [
            "Redis",
            "Effect",
            "Effect-TS",
            "Redis client",
            "TypeScript",
            "Valkey",
            "Dragonfly",
            "Upstash",
            "Redis Cluster",
            "Node.js",
            "Bun",
          ],
        }),
        webPageLd({
          name: pageTitle("Redis for Effect"),
          description:
            "A native Redis client for Effect with typed commands, scoped connections, pipelines, transactions, Pub/Sub and Streams. Runs on Node.js, Bun and Upstash HTTP.",
          path: "/redis",
          image: siteImageUrl("redis"),
        }),
        breadcrumbLd([
          { name: site.name, path: "/" },
          { name: "Redis for Effect", path: "/redis" },
        ]),
      ],
    }),
  component: Redis,
});

function Redis() {
  const { tokens, visual } = Route.useLoaderData();

  return (
    <RedisPage tokens={tokens} playground={<Playground categories={["redis"]} code={visual} />} />
  );
}
