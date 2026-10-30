/**
 * Site-wide identity used by SEO tags, JSON-LD, OG images and the sitemap. Set `VITE_SITE_URL`
 * to override the origin, for example on preview deployments.
 */
export const site = {
  name: "Effect Kit",
  url: (import.meta.env.VITE_SITE_URL ?? "https://effectkit.dev").replace(/\/$/, ""),
  tagline: "Composable tools for Effect",
  description:
    "Open-source packages that bring the infrastructure your app depends on into Effect: services you yield, Layers you swap and typed errors you can match on.",
  twitter: "@effectkit",
  github: "https://github.com/effect-kit",
  npm: "https://www.npmjs.com/org/effect-kit",
  locale: "en_US",
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  themeColor: "#09090b",
} as const;

/** Absolute URL for a path on this site. */
export const absolute = (path: string) => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
