import type { ReactNode } from "react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { RedisLogo } from "@/components/logos";
import { ButtonLink, ExternalButton } from "@/components/marketing/button";
import {
  Container,
  Heading,
  Lede,
  revealStyle,
  Section,
  SectionHeader,
} from "@/components/marketing/section";
import { RedisWriteFigure } from "@/features/figures/redis-write/figure";
import type { KeyedSnippets } from "@/lib/magic";

import { ApiTour } from "./api-tour";
import { ClusterRing } from "./cluster-ring";
import { EngineRail } from "./engine-rail";
import { EngineIcon, engines, hosted, runtimes } from "./engines";
import { RedisClosing } from "./redis-closing";
import { RuntimeSwitch } from "./runtime-switch";

/**
 * /redis: what it is and what it talks to (hero), the uncertain write (figure), then the
 * playground, the API, runtimes, cluster routing and what it supports.
 */
export function RedisPage({
  tokens,
  playground,
}: {
  readonly tokens: KeyedSnippets;
  readonly playground: ReactNode;
}) {
  return (
    <div data-accent="redis">
      <Hero />
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader
            eyebrow="When a connection drops"
            title="Know whether the write landed."
            lede="Before the write: unsent, safe to retry. After it: possibly-written, so it is never sent twice."
            wide
          />
          <div className="mt-12" data-reveal>
            <RedisWriteFigure />
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader index="01" eyebrow="Playground" title="Run it in your browser." />
          <div className="mt-12" data-reveal>
            {playground}
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader index="02" eyebrow="The API" title="Values keep their shape." />
          <div className="mt-12" data-reveal>
            <ApiTour tokens={tokens} />
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader
            index="03"
            eyebrow="Runtimes"
            title="Same program on every runtime."
            lede="Pick where it runs. Only the Layer changes."
            wide
          />
          <div className="mt-12" data-reveal>
            <RuntimeSwitch tokens={tokens} />
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader
            index="04"
            eyebrow="Cluster"
            title="Every key goes to its slot."
            lede="Type two keys. Put a {hash tag} in both to keep them together."
            wide
          />
          <div className="mt-12" data-reveal>
            <ClusterRing />
          </div>
        </Container>
      </Section>
      <Integrations />
      <RedisClosing />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative -mt-15 overflow-hidden">
      <div
        aria-hidden="true"
        className="ek-dotted pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_70%,black,transparent_80%)]"
      />
      <Container className="relative flex min-h-svh max-w-[1400px] flex-col items-center justify-center gap-14 pt-32 pb-20 text-center">
        <div className="flex flex-col items-center gap-8">
          <span className="flex animate-ek-rise items-center gap-2.5 rounded-full border border-(--ek-line) bg-fd-background px-3 py-1 font-mono text-xs text-fd-muted-foreground">
            <RedisLogo className="size-4 text-ek-accent" />
            @effect-kit/redis
          </span>
          <Heading
            as="h1"
            className="animate-ek-rise font-normal [animation-delay:80ms] md:text-[88px]"
          >
            Redis for Effect.
          </Heading>
          <Lede className="mx-auto max-w-[720px] animate-ek-rise text-pretty [animation-delay:160ms] md:text-xl">
            A native client with typed commands and scoped connections. One API for every server
            below.
          </Lede>
          <div className="flex animate-ek-rise flex-wrap justify-center gap-3 [animation-delay:240ms]">
            <ButtonLink
              to="/docs/$"
              params={{ _splat: "redis" }}
              label="Read the docs"
              className="h-11 px-5"
            />
            <ExternalButton
              href="https://github.com/effect-kit/redis"
              label="GitHub"
              icon={<GitHubIcon className="size-4" />}
              className="h-11 px-5"
            />
          </div>
        </div>
        <div className="w-full animate-ek-rise [animation-delay:320ms]">
          <EngineRail className="hidden sm:block" />
          <div className="flex flex-col gap-2 sm:hidden">
            <EngineRail items={engines.slice(0, 4)} />
            <EngineRail items={engines.slice(4)} offset={4} />
          </div>
        </div>
      </Container>
    </section>
  );
}

// Upstash sits on the hero rail as a backend, but here it belongs with the hosted services.
const groups = [
  { title: "Servers", items: engines.filter((engine) => engine.name !== "Upstash") },
  { title: "Hosted", items: [engines.find((engine) => engine.name === "Upstash"), ...hosted] },
  { title: "Runtimes", items: runtimes },
] as const;

function Integrations() {
  return (
    <Section>
      <Container className="max-w-[1400px] py-24 md:py-32">
        <SectionHeader index="05" eyebrow="Supported" title="Supported integrations." />
        <div className="mt-12 flex flex-col gap-10">
          {groups.map((group) => (
            <div key={group.title} className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
              <p className="pt-5 font-mono text-xs text-fd-muted-foreground">{group.title}</p>
              <ul className="grid grid-cols-2 border-t border-s border-(--ek-line) sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((item, index) =>
                  item ? (
                    <li
                      key={item.name}
                      data-reveal
                      style={revealStyle(index % 4)}
                      className="flex items-center gap-3 border-e border-b border-(--ek-line) px-5 py-5"
                    >
                      <EngineIcon mark={item.mark} className="size-6 shrink-0 text-fd-foreground" />
                      <span className="text-fd-foreground">{item.name}</span>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
