import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { BrandIcon } from "@/components/brands/brand-icon";
import { GitHubIcon } from "@/components/icons/github-icon";
import { EffectKitLogo } from "@/components/logos";
import { documentedPackages } from "@/lib/packages";

import { ParticleWordmark } from "./particle-wordmark";
import { Container } from "./section";

const social =
  "inline-flex items-center gap-2 rounded-md border border-(--ek-line-strong) px-3 py-2 text-sm text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-fd-ring";

const link =
  "rounded-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring";

const external = [
  { label: "effect.website", href: "https://effect.website", title: "Effect website" },
  { label: "Effect docs", href: "https://effect.website/docs", title: "Effect documentation" },
  {
    label: "npm @effect-kit",
    href: "https://www.npmjs.com/org/effect-kit",
    title: "Effect Kit packages on npm",
  },
] as const;

function Column({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="flex min-w-36 flex-col gap-4">
      <p className="font-mono text-xs text-fd-foreground/70">{title}</p>
      <ul className="flex flex-col gap-2.5 text-sm">{children}</ul>
    </div>
  );
}

/**
 * Link columns, then the wordmark as an interactive dot field cropped by the bottom bar, then
 * the licence line.
 */
export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-(--ek-line)">
      <Container className="relative flex max-w-[1400px] flex-col gap-12 pt-16 pb-12 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-4">
          <Link
            to="/"
            title="Effect Kit home"
            data-ph-capture-attribute-location="footer"
            className="flex w-fit items-center gap-2.5"
            aria-label="Effect Kit home"
          >
            <EffectKitLogo className="size-6" />
            <span className="font-semibold">Effect Kit</span>
          </Link>
          <p className="max-w-64 text-sm leading-relaxed text-fd-muted-foreground">
            Composable tools for Effect.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href="https://github.com/effect-kit"
              title="Effect Kit on GitHub"
              target="_blank"
              rel="noreferrer"
              className={social}
            >
              <GitHubIcon className="size-4" />
              GitHub
            </a>
            <a
              href="https://x.com/effectkit"
              title="Effect Kit on X"
              target="_blank"
              rel="noreferrer"
              className={social}
            >
              <BrandIcon brand="x" label="" className="size-3.5" />
              @effectkit
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:flex sm:gap-16">
          <Column title="Docs">
            {documentedPackages.map((pkg) => (
              <li key={pkg.slug}>
                <Link
                  to="/docs/$"
                  params={{ _splat: pkg.slug }}
                  title={`${pkg.name} documentation`}
                  data-ph-capture-attribute-location="footer"
                  className={link}
                >
                  {pkg.name}
                </Link>
              </li>
            ))}
          </Column>
          <Column title="Effect">
            {external.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  title={item.title}
                  target="_blank"
                  rel="noreferrer"
                  className={link}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </Column>
        </div>
      </Container>

      <ParticleWordmark className="mt-4" />

      <div className="relative border-t border-(--ek-line) bg-fd-background">
        <Container className="flex max-w-[1400px] flex-col gap-2 py-5 font-mono text-xs text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Effect Kit Contributors · Apache-2.0</span>
          <span className="flex items-center gap-4">
            <Link
              to="/terms"
              title="Terms of use"
              data-ph-capture-attribute-location="footer"
              className={link}
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              title="Privacy policy"
              data-ph-capture-attribute-location="footer"
              className={link}
            >
              Privacy
            </Link>
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-ek-accent" />
              Built on Effect
            </span>
          </span>
        </Container>
      </div>
    </footer>
  );
}
