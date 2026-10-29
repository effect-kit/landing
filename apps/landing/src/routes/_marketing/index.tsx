import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/features/home/home-page";
import { Playground, playgroundExampleIds, visualCode } from "@/features/visual";
import { siteImageUrl } from "@/lib/og/urls";
import { organizationLd, pageTitle, seo, webPageLd, websiteLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_marketing/")({
  loader: () => visualCode({ data: playgroundExampleIds(["redis", "emails"]) }),
  head: () =>
    seo({
      description: site.description,
      path: "/",
      image: { url: siteImageUrl("home"), alt: "Effect Kit: composable tools for Effect" },
      keywords: [
        "Effect",
        "Effect-TS",
        "TypeScript",
        "Redis",
        "email",
        "Layers",
        "typed errors",
        "open source",
      ],
      jsonLd: [
        organizationLd,
        websiteLd,
        webPageLd({
          name: pageTitle(),
          description: site.description,
          path: "/",
          image: siteImageUrl("home"),
        }),
      ],
    }),
  component: Home,
});

function Home() {
  const code = Route.useLoaderData();

  return <HomePage playground={<Playground categories={["redis", "emails"]} code={code} />} />;
}
