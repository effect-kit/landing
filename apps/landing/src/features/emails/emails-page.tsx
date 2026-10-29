import type { ReactNode } from "react";

import { GitHubIcon } from "@/components/icons/github-icon";
import { EmailsLogo } from "@/components/logos";
import { ButtonLink, ExternalButton } from "@/components/marketing/button";
import { Code, CodeWindow } from "@/components/marketing/code";
import { Container, Heading, Lede, Section, SectionHeader } from "@/components/marketing/section";
import { EmailsGaugeFigure } from "@/features/figures/emails-gauge/figure";
import type { KeyedSnippets } from "@/lib/magic";

import { EmailsClosing } from "./emails-closing";
import { Pigeonholes } from "./pigeonholes";
import { ProviderSwitch } from "./provider-switch";
import { SendTwice } from "./send-twice";
import { TemplatePreview } from "./template-preview";

/**
 * /emails: one service for every provider (hero), the capability check (figure), the provider
 * matrix, the playground, idempotent retries and React templates.
 */
export function EmailsPage({
  tokens,
  playground,
}: {
  readonly tokens: KeyedSnippets;
  readonly playground: ReactNode;
}) {
  return (
    <div data-accent="emails">
      <Hero />
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader
            eyebrow="Before it leaves"
            title="If the provider can't carry it, it isn't sent."
            lede="An attachment through MailerSend fails with UnsupportedFeatureError. No request is made."
            wide
          />
          <div className="mt-12" data-reveal>
            <EmailsGaugeFigure />
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader
            index="01"
            eyebrow="Providers"
            title="Change the provider, not the program."
            lede="Pick a provider. The import and the Layer change; the table shows what it supports."
            wide
          />
          <div className="mt-12" data-reveal>
            <ProviderSwitch tokens={tokens} />
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader index="02" eyebrow="Playground" title="Run it in your browser." />
          <div className="mt-12" data-reveal>
            {playground}
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader
            index="03"
            eyebrow="Idempotency"
            title="Retry without sending twice."
            lede="Pass an idempotency key. Each provider handles the repeat its own way, and you get a typed answer."
            wide
          />
          <div className="mt-12" data-reveal>
            <SendTwice />
          </div>
        </Container>
      </Section>
      <Section>
        <Container className="max-w-[1400px] py-24 md:py-32">
          <SectionHeader
            index="04"
            eyebrow="React templates"
            title="One component, two bodies."
            lede="EmailReact.render turns a React Email component into the HTML body and the plain-text body. Change the name to see both update."
            wide
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0" data-reveal>
            <CodeWindow title="welcome.tsx">
              <Code id="emails.react" />
            </CodeWindow>
            <TemplatePreview />
          </div>
        </Container>
      </Section>
      <EmailsClosing />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative -mt-15 overflow-hidden">
      <div
        aria-hidden="true"
        className="ek-dotted pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_70%_at_70%_55%,black,transparent_80%)]"
      />
      <Container className="relative grid min-h-svh max-w-[1400px] items-center gap-14 pt-32 pb-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col items-start gap-8">
          <span className="flex animate-ek-rise items-center gap-2.5 rounded-full border border-(--ek-line) bg-fd-background px-3 py-1 font-mono text-xs text-fd-muted-foreground">
            <EmailsLogo className="size-4 text-ek-accent" />
            @effect-kit/emails
          </span>
          <Heading
            as="h1"
            className="animate-ek-rise font-normal [animation-delay:80ms] md:text-[84px]"
          >
            Email for Effect.
          </Heading>
          <Lede className="max-w-[560px] animate-ek-rise text-pretty [animation-delay:160ms] md:text-xl">
            One Email service for 16 providers. Every message is checked against the provider before
            it is sent.
          </Lede>
          <div className="flex animate-ek-rise flex-wrap gap-3 [animation-delay:240ms]">
            <ButtonLink
              to="/docs/$"
              params={{ _splat: "emails" }}
              label="Read the docs"
              className="h-11 px-5"
            />
            <ExternalButton
              href="https://github.com/effect-kit/emails"
              label="GitHub"
              icon={<GitHubIcon className="size-4" />}
              className="h-11 px-5"
            />
          </div>
        </div>
        <div className="animate-ek-rise [animation-delay:200ms]">
          <Pigeonholes />
        </div>
      </Container>
    </section>
  );
}
