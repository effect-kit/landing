/**
 * PostHog project settings shared by the browser and server clients. The project key comes from
 * `VITE_POSTHOG_KEY` (`.env.local` locally, the Vercel project settings in production); without it
 * analytics stays off. Events only ever leave the production site.
 */
export const analyticsConfig = {
  key: import.meta.env.VITE_POSTHOG_KEY ?? "",
  /** Managed reverse proxy, so ad blockers that list PostHog's hosts do not drop events. */
  host: "https://t.envoy1084.xyz",
  uiHost: "https://us.posthog.com",
  productionHost: "effectkit.dev",
} as const;
