import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { useFumadocsLoader } from "fumadocs-core/source/client";
import { DocsLayout } from "fumadocs-ui/layouts/spacious";
import { DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/spacious/page";

import { ChangelogPagination, ChangelogTimeline } from "@/components/docs/changelog";
import { baseOptions } from "@/lib/layout.shared";
import { docsImageUrl } from "@/lib/og/urls";
import { getChangelogPackage, getPackage } from "@/lib/packages";
import { breadcrumbLd, SEPARATOR, seo } from "@/lib/seo";
import { gitConfig } from "@/lib/shared";
import { site } from "@/lib/site";
import { source } from "@/lib/source";
import { tabs } from "@/lib/tabs";

const loadChangelog = createServerFn({ method: "GET" })
  .validator((input: { readonly slug: string; readonly page: number }) => input)
  .handler(async ({ data: { slug, page } }) => {
    const pkg = getChangelogPackage([slug, "changelog"]);
    if (!pkg || !Number.isInteger(page) || page < 1) throw notFound();

    const { packageReleases, releaseHtml } = await import("@/lib/changelog.server");
    const pageTree = await source.serializePageTree(source.getPageTree());

    // GitHub can be down or rate limited; the page still renders and links to the releases.
    const result = await packageReleases(slug, page).catch(() => undefined);
    if (!result) return { slug, page, pageTree, releases: [], unavailable: true };

    const { entries, nextPage } = result;
    if (entries.length === 0 && page > 1) throw notFound();

    const releases = await Promise.all(
      entries.map(async (entry) => ({
        id: entry.id,
        title: entry.title,
        date: entry.date.toISOString(),
        prerelease: entry.prerelease,
        url: entry.url,
        html: await releaseHtml(entry.content ?? ""),
      })),
    );

    return { slug, page, pageTree, releases, nextPage, unavailable: false };
  });

export const Route = createFileRoute("/docs/$package/changelog/{-$page}")({
  component: Page,
  loader: ({ params }) =>
    loadChangelog({ data: { slug: params.package, page: Number(params.page ?? "1") } }),
  head: ({ loaderData }) => {
    if (!loaderData) return {};

    const pkg = getPackage(loaderData.slug);
    const name = pkg?.name ?? site.name;
    const path = `/docs/${loaderData.slug}/changelog${loaderData.page > 1 ? `/${loaderData.page}` : ""}`;

    return seo({
      title: `Changelog${SEPARATOR}${name} Docs`,
      description: `Release notes for @effect-kit/${loaderData.slug}, newest first.`,
      path,
      image: { url: docsImageUrl([loaderData.slug]), alt: `${name} changelog` },
      section: name,
      jsonLd: [
        breadcrumbLd([
          { name: site.name, path: "/" },
          { name: `${name} Docs`, path: `/docs/${loaderData.slug}` },
          { name: "Changelog", path },
        ]),
      ],
    });
  },
});

function Page() {
  const { slug, page, pageTree, releases, nextPage, unavailable } = useFumadocsLoader(
    Route.useLoaderData(),
  );
  const releasesUrl = `https://github.com/${gitConfig.user}/${slug}/releases`;

  return (
    <DocsLayout {...baseOptions(getPackage(slug))} tree={pageTree} tabs={tabs}>
      <DocsPage toc={[]}>
        <DocsTitle>Changelog</DocsTitle>
        <DocsDescription className="mb-2">
          Release notes for <code>@effect-kit/{slug}</code>, newest first, from{" "}
          <a
            href={releasesUrl}
            title={`@effect-kit/${slug} releases on GitHub`}
            className="underline underline-offset-4"
          >
            its GitHub releases
          </a>
          .
        </DocsDescription>
        <div className="border-t pt-6">
          {unavailable ? (
            <p className="text-fd-muted-foreground">
              The releases could not be loaded right now. Read them{" "}
              <a
                href={releasesUrl}
                title={`@effect-kit/${slug} releases on GitHub`}
                className="underline underline-offset-4"
              >
                on GitHub
              </a>
              .
            </p>
          ) : (
            <ChangelogTimeline releases={releases} />
          )}
          <ChangelogPagination
            slug={slug}
            newer={page > 1 ? page - 1 : undefined}
            older={nextPage}
            className="mt-10"
          />
        </div>
      </DocsPage>
    </DocsLayout>
  );
}
