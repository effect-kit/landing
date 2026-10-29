import { absolute } from "@/lib/site";

/** OG image for a docs page: `/og/docs/<slugs>/image.png`. */
export const docsImagePath = (slugs: readonly string[]) =>
  `/og/docs/${[...slugs, "image.png"].join("/")}`;

export type SitePage = "home" | "redis" | "emails";

/** OG image for a landing page: `/og/<page>.png`. */
export const siteImagePath = (page: SitePage) => `/og/${page}.png`;

export const docsImageUrl = (slugs: readonly string[]) => absolute(docsImagePath(slugs));
export const siteImageUrl = (page: SitePage) => absolute(siteImagePath(page));
