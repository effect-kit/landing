import { Pigeonholes, KitStack, PlateStack, ServerRail } from "./art";
import { Description, Frame, PackageMark, Title } from "./frame";
import { type Accent, accents, LINE, MUTED } from "./primitives";

/**
 * Open Graph images, 1200 × 630: one per landing page and one per docs page. Everything is plain
 * elements and inline SVG (no React components inside SVG) so Takumi can lay them out.
 */

export { OG, accents, type Accent } from "./primitives";

export function SiteImage({ page }: { page: "home" | "redis" | "emails" }) {
  if (page === "redis") {
    return (
      <Frame accent="redis" crumb="Redis" art={<ServerRail />} wide={false}>
        <Title size={92}>Redis for Effect.</Title>
        <Description>
          Typed commands and scoped connections, on Redis, Valkey, Dragonfly, Upstash and more.
        </Description>
      </Frame>
    );
  }

  if (page === "emails") {
    return (
      <Frame accent="emails" crumb="Emails" art={<Pigeonholes />} wide={false}>
        <Title size={92}>Email for Effect.</Title>
        <Description>
          One Email service for 16 providers, checked before anything is sent.
        </Description>
      </Frame>
    );
  }

  return (
    <Frame accent="kit" art={<KitStack />} wide={false}>
      <Title size={72}>Composable tools for Effect.</Title>
      <Description>Services you yield, Layers you swap, typed errors you can match on.</Description>
    </Frame>
  );
}

export function DocsImage({
  accent,
  slug,
  section,
  title,
  description,
}: {
  accent: Accent;
  slug: string | undefined;
  section: string;
  title: string;
  description: string | undefined;
}) {
  const size = title.length > 46 ? 56 : title.length > 26 ? 66 : 80;

  return (
    <Frame
      accent={accent}
      crumb={section}
      art={<PlateStack accent={accent} {...(slug ? { slug } : {})} />}
    >
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          alignItems: "center",
          gap: 10,
          padding: "6px 14px",
          borderRadius: 9999,
          border: `1px solid ${LINE}`,
          fontFamily: "JetBrains Mono",
          fontSize: 18,
          color: MUTED,
        }}
      >
        <PackageMark slug={slug ?? ""} size={18} color={accents[accent]} />
        Documentation
      </div>
      <Title size={size}>{title}</Title>
      {description ? (
        <Description>
          {description.length > 140 ? `${description.slice(0, 137)}…` : description}
        </Description>
      ) : null}
    </Frame>
  );
}
