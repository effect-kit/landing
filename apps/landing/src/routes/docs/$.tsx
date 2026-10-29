import { Suspense, use } from "react";

import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { useFumadocsLoader } from "fumadocs-core/source/client";
import { DocsLayout } from "fumadocs-ui/layouts/spacious";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/spacious/page";

import { useMDXComponents } from "@/components/mdx";
import { baseOptions } from "@/lib/layout.shared";
import { docsImageUrl } from "@/lib/og/urls";
import { getPackage } from "@/lib/packages";
import { breadcrumbLd, SEPARATOR, seo, techArticleLd } from "@/lib/seo";
import { site } from "@/lib/site";
import { docs, source } from "@/lib/source";
import { tabs } from "@/lib/tabs";

const serverLoader = createServerFn({ method: "GET" })
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    const pkg = getPackage(page.slugs[0]);

    // The git modified date ships with the compiled page in async mode.
    const { lastModified } = await page.data.load();

    return {
      path: page.path,
      packageSlug: page.slugs[0],
      pageTree: await source.serializePageTree(source.getPageTree()),
      meta: {
        url: page.url,
        slugs: page.slugs,
        title: page.data.title,
        description:
          page.data.description ?? `${page.data.title} in the ${pkg?.name ?? site.name} docs.`,
        section: pkg?.name ?? "Docs",
        keywords: page.data.keywords ?? [],
        published: page.data.published,
        modified: lastModified?.toISOString(),
      },
    };
  });

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/").filter(Boolean) ?? [];
    const data = await serverLoader({ data: slugs });

    await docs.getPage(data.path)?.preload();

    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { meta } = loaderData;
    const isIndex = meta.slugs.length <= 1;

    const title = isIndex
      ? `${meta.section} Docs`
      : `${meta.title}${SEPARATOR}${meta.section} Docs`;
    const image = docsImageUrl(meta.slugs);

    const keywords = [
      meta.section,
      "Effect",
      "Effect-TS",
      "TypeScript",
      "documentation",
      ...meta.keywords,
    ];

    return seo({
      title,
      description: meta.description,
      path: meta.url,
      type: "article",
      image: { url: image, alt: `${meta.title}, ${meta.section} documentation` },
      section: meta.section,
      keywords,
      ...(meta.published ? { publishedTime: meta.published } : {}),
      ...(meta.modified ? { modifiedTime: meta.modified } : {}),
      jsonLd: [
        techArticleLd({
          title: meta.title,
          description: meta.description,
          path: meta.url,
          image,
          section: meta.section,
          keywords,
          ...(meta.modified ? { modifiedTime: meta.modified } : {}),
          ...(meta.published ? { publishedTime: meta.published } : {}),
        }),
        breadcrumbLd([
          { name: site.name, path: "/" },
          { name: `${meta.section} Docs`, path: `/docs/${meta.slugs[0] ?? ""}` },
          ...(isIndex ? [] : [{ name: meta.title, path: meta.url }]),
        ]),
      ],
    });
  },
});

function Content({ path }: { path: string }) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`Unknown page: ${path}`);

  const { toc } = use(page.load());
  const MDX = page.body;

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <DocsBody>
        <MDX components={useMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

function Page() {
  const { path, pageTree, packageSlug } = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout {...baseOptions(getPackage(packageSlug))} tree={pageTree} tabs={tabs}>
      <Suspense>
        <Content path={path} />
      </Suspense>
    </DocsLayout>
  );
}
