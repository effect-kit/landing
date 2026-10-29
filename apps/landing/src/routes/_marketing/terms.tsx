import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/marketing/legal-page";
import { loadLegal, preloadLegal } from "@/lib/legal";
import { siteImageUrl } from "@/lib/og/urls";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/terms")({
  loader: async () => {
    const data = await loadLegal({ data: "terms" });

    await preloadLegal(data.path);

    return data;
  },
  head: () =>
    seo({
      title: "Terms of use",
      description: "The rules for using effectkit.dev and its documentation.",
      path: "/terms",
      image: { url: siteImageUrl("home"), alt: "Effect Kit: composable tools for Effect" },
    }),
  component: Page,
});

function Page() {
  return <LegalPage data={Route.useLoaderData()} />;
}
