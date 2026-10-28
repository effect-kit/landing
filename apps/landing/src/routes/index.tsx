import { createFileRoute, Link } from "@tanstack/react-router";

import { HomeLayout } from "fumadocs-ui/layouts/home";

import { baseOptions } from "@/lib/layout.shared";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Effect Kit</h1>
        <p className="max-w-md text-fd-muted-foreground">
          Composable, open-source tooling for Effect.
        </p>
        <Link
          to="/docs"
          className="rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground"
        >
          Read the docs
        </Link>
      </main>
    </HomeLayout>
  );
}
