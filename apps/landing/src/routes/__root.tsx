import type { ReactNode } from "react";

import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import { RootProvider } from "fumadocs-ui/provider/tanstack";

import SearchDialog from "@/components/search";

import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#09090b" },
      { title: "Effect Kit" },
      {
        name: "description",
        content: "Composable, open-source tooling for Effect.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
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
