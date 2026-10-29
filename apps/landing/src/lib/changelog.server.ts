import { renderToStaticMarkup } from "react-dom/server";

import { type GitHubReleases, githubReleases } from "@fumadocs/changelog/github";
import { Markdown } from "fumadocs-core/content/md";
import { remarkGfm } from "fumadocs-core/mdx-plugins/remark-gfm";

import type { PackageInfo } from "./packages";
import { gitConfig } from "./shared";
import { absolute } from "./site";

// Server only: imported dynamically from server functions and routes.

/** Releases shown per changelog page. */
const RELEASES_PER_PAGE = 20;

const TTL_MS = 60 * 60 * 1000;
const cache = new Map<
  string,
  { readonly at: number; readonly releases: Promise<GitHubReleases> }
>();

/**
 * A page of the package's GitHub releases, newest first. Cached for an hour per server because
 * unauthenticated GitHub requests are limited to 60 an hour; set `GITHUB_TOKEN` to raise that.
 */
export function packageReleases(slug: string, page: number): Promise<GitHubReleases> {
  const key = `${slug}:${page}`;
  const hit = cache.get(key);

  if (hit && Date.now() - hit.at < TTL_MS) return hit.releases;

  const token = process.env.GITHUB_TOKEN;
  const releases = githubReleases({
    owner: gitConfig.user,
    repo: slug,
    page,
    perPage: RELEASES_PER_PAGE,
    ...(token ? { token } : {}),
  });

  cache.set(key, { at: Date.now(), releases });
  // A failed request is retried on the next visit instead of being served for an hour.
  releases.catch(() => cache.delete(key));

  return releases;
}

/**
 * Release notes as HTML, rendered on the server so the browser ships no Markdown pipeline.
 * The notes come from the packages' own GitHub releases. The Markdown pipeline is async, so the
 * tree is awaited before rendering; static rendering cannot wait for a suspended component.
 */
export async function releaseHtml(markdown: string): Promise<string> {
  const tree = await Markdown({ children: markdown, async: true, remarkPlugins: [remarkGfm] });

  return renderToStaticMarkup(tree);
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

/** The latest releases as Markdown, for agents reading `/docs/<package>/changelog.md`. */
export async function changelogMarkdown(pkg: PackageInfo): Promise<string> {
  const { entries } = await packageReleases(pkg.slug, 1);
  const repo = `https://github.com/${gitConfig.user}/${pkg.slug}/releases`;

  return [
    `# ${pkg.name} changelog`,
    `> For the complete documentation index, see [llms.txt](${absolute("/llms.txt")}).`,
    `Releases of \`@effect-kit/${pkg.slug}\`, newest first. All releases: ${repo}`,
    ...entries.map((entry) =>
      [`## ${entry.title}`, dateFormat.format(entry.date), entry.content ?? ""]
        .filter(Boolean)
        .join("\n\n"),
    ),
  ].join("\n\n");
}
