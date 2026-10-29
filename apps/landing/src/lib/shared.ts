export const appName = "Effect Kit";
export const docsRoute = "/docs";

export const gitConfig = {
  user: "effect-kit",
  repo: "landing",
  branch: "main",
} as const;

/** Markdown version of a docs page: `/docs/redis` is served as `/docs/redis.md`. */
export function getPageMarkdownUrl(page: { slugs: readonly string[] }) {
  const segments = page.slugs.length > 0 ? [...page.slugs] : ["index"];

  return `${docsRoute}/${segments.join("/")}.md`;
}
