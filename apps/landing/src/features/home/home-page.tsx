import { type ReactNode, useRef } from "react";

import { Link } from "@tanstack/react-router";

import { EmailsLogo, type LogoProps, RedisLogo, StorageLogo } from "@/components/logos";
import { useSectionView } from "@/components/marketing/hooks";
import {
  Container,
  Heading,
  Lede,
  revealStyle,
  Section,
  SectionHeader,
} from "@/components/marketing/section";
import { track } from "@/lib/analytics/client";
import { cn } from "@/lib/cn";

import { Closing } from "./closing";
import { IsoField } from "./iso-field";
import { LayerStack } from "./layer-stack";

/**
 * Home: what Effect Kit is (hero, product cloud and terrain band), which packages exist, and
 * how the layers of an Effect Kit app fit together. Each block answers one question a new reader has, in that order.
 */
export function HomePage({ playground }: { readonly playground: ReactNode }) {
  return (
    <div data-accent="kit">
      <Hero />
      <Packages />
      <LayerStack />
      <Section id="playground">
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader
            index="02"
            eyebrow="Playground"
            title="Run the packages in your browser."
            lede="Real Effect programs against a simulated backend. Press play, change a control, break things."
            wide
          />
          <div className="mt-12" data-reveal>
            {playground}
          </div>
        </Container>
      </Section>
      <Closing />
    </div>
  );
}

/**
 * Hero: title and a two-line pitch inside a hairline frame with corner marks (Griffin's
 * visible grid), an isometric floor that breathes behind it, and the terrain band underneath.
 */
function Hero() {
  const root = useRef<HTMLElement>(null);
  useSectionView(root, "hero");

  return (
    <section ref={root} data-section="" className="relative -mt-15 overflow-hidden">
      <IsoField className="absolute inset-0 size-full" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_44%_46%_at_50%_52%,var(--color-fd-background)_45%,transparent_100%)]"
      />
      {/* The floor fades in from under the navbar and out into the next section. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-fd-background via-fd-background/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-fd-background to-transparent"
      />
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-9 px-5 pt-36 pb-28 text-center">
        <p className="flex animate-ek-rise items-center gap-2.5 rounded-full border border-(--ek-line) bg-fd-background px-3 py-1 text-sm text-fd-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-ek-accent/60 motion-reduce:hidden" />
            <span className="relative size-2 rounded-full bg-ek-accent" />
          </span>
          Redis and Emails are live
        </p>
        <Heading
          as="h1"
          className="animate-ek-rise font-normal whitespace-pre-line [animation-delay:80ms] md:text-[92px]"
        >
          <span className="ek-shine animate-ek-shine motion-reduce:animate-none">
            {"Composable tools\nfor Effect."}
          </span>
        </Heading>
        <Lede className="mx-auto max-w-[780px] animate-ek-rise text-pretty [animation-delay:160ms] md:text-xl">
          The infrastructure your app depends on, as Effect services: Layers you can swap and typed
          errors you can match on.
        </Lede>
        <div className="flex animate-ek-rise flex-wrap items-center justify-center gap-3 pt-1 [animation-delay:240ms]">
          <PackageButton to="/redis" Logo={RedisLogo} label="Redis for Effect" primary />
          <PackageButton to="/emails" Logo={EmailsLogo} label="Emails for Effect" />
        </div>
      </div>
    </section>
  );
}

function PackageButton({
  to,
  Logo,
  label,
  primary = false,
}: {
  readonly to: "/redis" | "/emails";
  readonly Logo: (props: LogoProps) => ReactNode;
  readonly label: string;
  readonly primary?: boolean;
}) {
  return (
    <Link
      to={to}
      title={label}
      onClick={() =>
        track("cta_clicked", { cta: `${to.slice(1)}_page`, location: "hero", href: to })
      }
      className={cn(
        "group inline-flex h-11 items-center gap-2.5 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring",
        primary
          ? "bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/88"
          : "border border-(--ek-line-strong) text-fd-foreground hover:border-fd-foreground/30 hover:bg-fd-accent",
      )}
    >
      <Logo className="size-4.5" />
      {label}
    </Link>
  );
}

const kit = [
  {
    slug: "redis",
    to: "/redis",
    name: "Redis",
    Logo: RedisLogo,
    pitch: "Redis for Effect v4. A native client with typed commands and scoped connections.",
    facts: [
      "Typed commands and Schema-backed keys",
      "Pipelines, transactions, Pub/Sub",
      "Cluster and Sentinel routing",
    ],
  },
  {
    slug: "emails",
    to: "/emails",
    name: "Emails",
    Logo: EmailsLogo,
    pitch: "One Email API across 16 providers, with React templates and bounded batches.",
    facts: [
      "Capability checks before sending",
      "Errors that say whether it was sent",
      "Batches of up to 1,000 messages",
    ],
  },
  {
    slug: "storage",
    to: undefined,
    name: "Storage",
    Logo: StorageLogo,
    pitch: "Object storage for Effect. Put, scoped get, head, delete and paginated listing.",
    facts: [
      "Conditional writes, like create-only",
      "Single-use reads tied to their scope",
      "Lazy, paginated listing",
    ],
  },
] as const;

const cell =
  "group relative flex min-h-80 flex-col border-e border-b border-dashed border-(--ek-line-strong) p-6 transition-colors duration-300 hover:bg-fd-card/60";

/** The whole card is the package link (stretched), with its docs link layered above it. */
function KitCard({ pkg, index }: { readonly pkg: (typeof kit)[number]; readonly index: number }) {
  return (
    <div data-reveal data-accent={pkg.slug} style={revealStyle(index)} className={cell}>
      <pkg.Logo
        className={cn(
          "size-9 transition-colors duration-300",
          pkg.to ? "group-hover:text-ek-accent" : "text-fd-muted-foreground/70",
        )}
      />
      <h3 className="mt-8 flex items-center gap-2 text-xl font-light tracking-[-0.01em]">
        {pkg.to ? (
          <Link
            to={pkg.to}
            title={`${pkg.name} for Effect`}
            onClick={() =>
              track("cta_clicked", { cta: `${pkg.slug}_page`, location: "packages", href: pkg.to })
            }
            className="rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fd-ring"
          >
            {pkg.name}
          </Link>
        ) : (
          pkg.name
        )}
        {pkg.to ? null : (
          <span className="rounded border border-(--ek-line-strong) px-1.5 py-0.5 font-mono text-[10px] text-fd-muted-foreground">
            coming soon
          </span>
        )}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">{pkg.pitch}</p>
      <ul className="mt-auto flex flex-col gap-1.5 pt-6 font-mono text-[11px] text-fd-muted-foreground">
        {pkg.facts.map((fact) => (
          <li key={fact} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-ek-accent">
              /
            </span>
            {fact}
          </li>
        ))}
      </ul>
      <div className="mt-5 border-t border-(--ek-line) pt-4 font-mono text-[11px]">
        {pkg.to ? (
          <Link
            to="/docs/$"
            title={`${pkg.name} documentation`}
            params={{ _splat: pkg.slug }}
            onClick={() =>
              track("cta_clicked", {
                cta: `${pkg.slug}_docs`,
                location: "packages",
                href: `/docs/${pkg.slug}`,
              })
            }
            className="relative z-10 rounded-sm text-fd-foreground/80 underline decoration-(--ek-line-strong) underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
          >
            {pkg.name} docs
          </Link>
        ) : (
          <span className="text-fd-muted-foreground">Docs coming soon</span>
        )}
      </div>
    </div>
  );
}

function Packages() {
  return (
    <Section rule={false} id="packages">
      <Container className="max-w-[1400px] py-24">
        <SectionHeader
          index="01"
          eyebrow="The kit"
          wide
          title="Pick the pieces you need."
          lede="Every package is its own install with its own Layers, so your app only carries what it uses."
        />
        <div className="mt-14 grid border-t border-s border-dashed border-(--ek-line-strong) sm:grid-cols-2 lg:grid-cols-4">
          {kit.map((pkg, index) => (
            <KitCard key={pkg.slug} pkg={pkg} index={index} />
          ))}
          <a
            href="https://github.com/effect-kit"
            title="Propose an integration on GitHub"
            target="_blank"
            rel="noreferrer"
            aria-label="Your integration: open an issue on github.com/effect-kit"
            onClick={() =>
              track("outbound_link_clicked", {
                destination: "https://github.com/effect-kit",
                host: "github.com",
                location: "packages",
              })
            }
            data-reveal
            style={revealStyle(3)}
            className={cn(
              cell,
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fd-ring",
            )}
          >
            <span className="flex flex-1 flex-col">
              <span className="grid size-9 place-items-center rounded-md border border-dashed border-(--ek-line-strong) font-mono text-fd-muted-foreground transition-colors group-hover:border-ek-accent group-hover:text-ek-accent">
                +
              </span>
              <span className="mt-8 text-xl font-light tracking-[-0.01em]">Your integration</span>
              <span className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                New integrations are welcome. Open an issue with a use case first.
              </span>
              <span className="mt-auto pt-6 font-mono text-[11px] text-fd-muted-foreground transition-colors duration-300 group-hover:text-fd-foreground">
                github.com/effect-kit
              </span>
            </span>
          </a>
        </div>
      </Container>
    </Section>
  );
}
