import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/marketing/legal-page";
import { loadLegal, preloadLegal } from "@/lib/legal";
import { siteImageUrl } from "@/lib/og/urls";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/privacy")({
  loader: async () => {
    const data = await loadLegal({ data: "privacy" });

    await preloadLegal(data.path);

    return data;
  },
  head: () =>
    seo({
      title: "Privacy policy",
      description: "What effectkit.dev collects when you visit, and what it does not.",
      path: "/privacy",
      image: { url: siteImageUrl("home"), alt: "Effect Kit: composable tools for Effect" },
    }),
  component: Page,
});

function Page() {
  return <LegalPage data={Route.useLoaderData()} />;
}
