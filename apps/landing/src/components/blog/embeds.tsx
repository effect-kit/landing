import { createContext, type ReactNode, use } from "react";

import { EmailsGaugeFigure } from "@/features/figures/emails-gauge/figure";
import { KitRackFigure } from "@/features/figures/kit-rack/figure";
import { RedisWriteFigure } from "@/features/figures/redis-write/figure";
import { Playground as VisualPlayground, type PlaygroundCategory } from "@/features/visual";
import type { VisualCode } from "@/features/visual";
import { cdn } from "@/lib/cdn";
import { cn } from "@/lib/cn";

/*
 * Components a post can use in its MDX beyond the docs set: the site's interactive figures, the
 * playground and numbered images from the CDN. Each figure keeps the accent of the package it
 * explains, whatever the post's own accent is.
 */

interface PostEmbeds {
  readonly slug: string;
  readonly playground: readonly PlaygroundCategory[];
  readonly visual: VisualCode | undefined;
}

export const PostEmbedsContext = createContext<PostEmbeds | undefined>(undefined);

function usePostEmbeds(component: string): PostEmbeds {
  const value = use(PostEmbedsContext);
  if (!value) throw new Error(`<${component}> can only be used in a blog post.`);

  return value;
}

/** A full-width block in the post with an optional caption under it. */
function Embed({
  accent,
  caption,
  className,
  children,
}: {
  readonly accent?: "redis" | "emails";
  readonly caption?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <figure
      {...(accent ? { "data-accent": accent } : {})}
      className={cn("not-prose my-10 flex flex-col gap-3", className)}
    >
      {children}
      {caption ? (
        <figcaption className="font-mono text-xs leading-relaxed text-fd-muted-foreground">
          <span aria-hidden="true" className="text-ek-accent">
            {"// "}
          </span>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

interface FigureProps {
  readonly caption?: ReactNode;
  /** Figure number, shown as "Fig 2" in the corner. */
  readonly fig?: number;
}

const figLabel = (fig: number | undefined) => `Fig ${fig ?? 1}`;

export function RedisWrite({ caption, fig }: FigureProps) {
  return (
    <Embed accent="redis" caption={caption}>
      <RedisWriteFigure fig={figLabel(fig)} />
    </Embed>
  );
}

export function EmailsGate({ caption, fig }: FigureProps) {
  return (
    <Embed accent="emails" caption={caption}>
      <EmailsGaugeFigure fig={figLabel(fig)} />
    </Embed>
  );
}

export function SwapLayer({ caption, fig }: FigureProps) {
  return (
    <Embed caption={caption}>
      <KitRackFigure fig={figLabel(fig)} />
    </Embed>
  );
}

/** The landing pages' playground, with the categories listed in the post's `playground`. */
export function Playground({ caption }: Pick<FigureProps, "caption">) {
  const { playground, visual } = usePostEmbeds("Playground");

  if (playground.length === 0 || !visual) {
    throw new Error("Add `playground: [redis, emails]` to the post's frontmatter to embed it.");
  }

  return (
    <Embed caption={caption}>
      <VisualPlayground categories={playground} code={visual} />
    </Embed>
  );
}

/**
 * An image from the post's CDN folder: `<PostImage n={1} … />` is `blog/<slug>/1.webp`. Sizes
 * are required so the image reserves its space while it loads.
 */
export function PostImage({
  n,
  alt,
  width,
  height,
  caption,
  ext = "webp",
}: {
  readonly n: number;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly caption?: ReactNode;
  readonly ext?: "webp" | "png" | "jpg" | "gif" | "svg";
}) {
  const { slug } = usePostEmbeds("PostImage");

  return (
    <Embed caption={caption}>
      <img
        src={cdn(`blog/${slug}/${n}.${ext}`)}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-xl border border-(--ek-line)"
      />
    </Embed>
  );
}

export const blogMdxComponents = {
  EmailsGate,
  Playground,
  PostImage,
  RedisWrite,
  SwapLayer,
};
