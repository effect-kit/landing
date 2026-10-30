import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { RssIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Container, Eyebrow, Heading, Lede } from "@/components/marketing/section";
import { track } from "@/lib/analytics/client";
import { categoryLabels } from "@/lib/blog/format";
import type { PostSummary } from "@/lib/blog/posts";
import { type BlogCategory, blogCategories } from "@/lib/blog/schema";
import { cn } from "@/lib/cn";

import { FeaturedPost, PostCard } from "./post-card";

/** Page header shared by the blog index and tag pages: eyebrow, title, lede and the feed link. */
export function BlogHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  readonly eyebrow: string;
  readonly title: ReactNode;
  readonly lede: ReactNode;
  readonly children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="ek-err-backdrop pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      />
      <Container className="relative flex flex-col gap-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="flex animate-ek-rise flex-col gap-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading as="h1" className="max-w-4xl">
            {title}
          </Heading>
          <Lede>{lede}</Lede>
        </div>
        <div className="flex animate-ek-rise flex-wrap items-center gap-3 [animation-delay:80ms]">
          <a
            href="/blog/rss.xml"
            title="Effect Kit blog RSS feed"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-(--ek-line-strong) px-3 text-sm text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-fd-ring"
          >
            <HugeiconsIcon icon={RssIcon} size={15} strokeWidth={1.8} className="text-ek-accent" />
            RSS feed
          </a>
          {children}
        </div>
      </Container>
    </section>
  );
}

const chip =
  "inline-flex h-8 items-center gap-2 rounded-full border px-3.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-fd-ring";

function Filters({
  active,
  counts,
}: {
  readonly active: BlogCategory | undefined;
  readonly counts: ReadonlyMap<BlogCategory | "all", number>;
}) {
  const options = [
    { value: undefined, label: "All", count: counts.get("all") ?? 0 },
    ...blogCategories.map((category) => ({
      value: category,
      label: categoryLabels[category].many,
      count: counts.get(category) ?? 0,
    })),
  ].filter((option) => option.count > 0 || option.value === active);

  return (
    <nav aria-label="Filter posts" className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <ul className="flex w-max gap-2">
        {options.map((option) => {
          const selected = option.value === active;

          return (
            <li key={option.label}>
              <Link
                to="/blog"
                search={option.value ? { category: option.value } : {}}
                replace
                resetScroll={false}
                title={`${option.label} posts`}
                aria-current={selected ? "page" : undefined}
                onClick={() =>
                  track("blog_filter_changed", {
                    category: option.value ?? "all",
                    previous: active ?? "all",
                  })
                }
                className={cn(
                  chip,
                  selected
                    ? "border-fd-foreground/80 bg-fd-foreground text-fd-background"
                    : "border-(--ek-line-strong) text-fd-muted-foreground hover:border-fd-foreground/30 hover:text-fd-foreground",
                )}
              >
                {option.label}
                <span className={cn("tabular-nums", selected ? "opacity-60" : "opacity-50")}>
                  {option.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Responsive grid of post cards. */
export function PostGrid({
  posts,
  surface = "list",
}: {
  readonly posts: readonly PostSummary[];
  readonly surface?: "list" | "related";
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <li
          key={post.slug}
          className="flex animate-ek-rise"
          style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
        >
          <PostCard post={post} surface={surface} />
        </li>
      ))}
    </ul>
  );
}

/**
 * The blog index: the newest featured post wide at the top, then every other post in a grid
 * that the category chips filter. Filtering is a search param, so a filtered view is a link.
 */
export function BlogIndex({
  posts,
  category,
}: {
  readonly posts: readonly PostSummary[];
  readonly category: BlogCategory | undefined;
}) {
  const counts = new Map<BlogCategory | "all", number>([["all", posts.length]]);
  for (const post of posts) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);

  const featured = category ? undefined : posts.find((post) => post.featured);
  const listed = posts.filter(
    (post) => post !== featured && (!category || post.category === category),
  );

  return (
    <>
      <BlogHeader
        eyebrow="Blog"
        title="Releases, guides and notes."
        lede="What changed in each Effect Kit package, how to use it, and why it works the way it does."
      />
      <Container className="flex flex-col gap-10 pb-24">
        {featured ? <FeaturedPost post={featured} /> : null}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 border-t border-(--ek-line) pt-8 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-mono text-xs text-fd-muted-foreground">
              <span className="text-ek-accent">{"// "}</span>
              {category ? categoryLabels[category].many : "All posts"}
            </h2>
            <Filters active={category} counts={counts} />
          </div>
          {listed.length > 0 ? (
            <PostGrid posts={listed} />
          ) : (
            <p className="rounded-xl border border-dashed border-(--ek-line-strong) px-6 py-12 text-center text-sm text-fd-muted-foreground">
              {posts.length === 0
                ? "The first post is on its way."
                : category
                  ? `No ${categoryLabels[category].many.toLowerCase()} yet.`
                  : "Every post is featured above."}
            </p>
          )}
        </div>
      </Container>
    </>
  );
}
