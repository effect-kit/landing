import { createFileRoute, Link } from "@tanstack/react-router";

import { BlogHeader, PostGrid } from "@/components/blog/blog-index";
import { Container } from "@/components/marketing/section";
import { tagLabels } from "@/lib/blog/format";
import { loadBlogTag } from "@/lib/blog/loaders";
import { siteImageUrl } from "@/lib/og/urls";
import { breadcrumbLd, seo } from "@/lib/seo";
import { site } from "@/lib/site";

export const Route = createFileRoute("/_marketing/blog/tags/$tag")({
  loader: ({ params }) => loadBlogTag({ data: params.tag }),
  head: ({ loaderData }) => {
    if (!loaderData) return {};

    const label = tagLabels[loaderData.tag];
    const path = `/blog/tags/${loaderData.tag}`;

    return seo({
      title: `${label} posts`,
      description: `Effect Kit blog posts tagged ${label}: releases, guides and notes.`,
      path,
      image: { url: siteImageUrl("blog"), alt: "Effect Kit blog: releases, guides and notes" },
      jsonLd: [
        breadcrumbLd([
          { name: site.name, path: "/" },
          { name: "Blog", path: "/blog" },
          { name: label, path },
        ]),
      ],
    });
  },
  component: Page,
});

function Page() {
  const { tag, posts } = Route.useLoaderData();
  const count = `${posts.length} ${posts.length === 1 ? "post" : "posts"}`;

  return (
    <>
      <BlogHeader
        eyebrow={`Tag / #${tag}`}
        title={tagLabels[tag]}
        lede={`${count} tagged #${tag}.`}
      >
        <Link
          to="/blog"
          title="All posts"
          className="inline-flex h-9 items-center rounded-md px-3 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          All posts
        </Link>
      </BlogHeader>
      <Container className="pb-24">
        <PostGrid posts={posts} />
      </Container>
    </>
  );
}
