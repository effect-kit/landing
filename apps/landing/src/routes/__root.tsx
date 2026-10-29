import type { ReactNode } from "react";

import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import { RootProvider } from "fumadocs-ui/provider/tanstack";

import SearchDialog from "@/components/search";
import { pageTitle } from "@/lib/seo";
import { site } from "@/lib/site";

import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  // Pages change with each deploy; let caches revalidate instead of holding them for long.
  headers: () => ({ "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate" }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", media: "(prefers-color-scheme: dark)", content: site.themeColor.dark },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: light)",
        content: site.themeColor.light,
      },
      { name: "color-scheme", content: "dark light" },
      { name: "application-name", content: site.name },
      { name: "apple-mobile-web-app-title", content: site.name },
      { name: "format-detection", content: "telephone=no" },
      { name: "generator", content: "TanStack Start" },
      { title: pageTitle() },
      { name: "description", content: site.description },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
      { rel: "me", href: site.github },
    ],
  }),
  component: RootComponent,
});

const theme = { defaultTheme: "dark" } as const;
const search = { SearchDialog } as const;

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* For agents: where the plain-text docs live. Hidden from sighted readers only. */}
        <p className="sr-only">
          Documentation for agents: an index at <a href="/llms.txt">/llms.txt</a>, every docs page
          in one file at <a href="/llms-full.txt">/llms-full.txt</a>, and Markdown for any docs page
          by adding .md to its URL.
        </p>
        <RootProvider theme={theme} search={search}>
          {children}
        </RootProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}
