import { type ComponentType, useEffect, useRef, useState } from "react";

import { Link } from "@tanstack/react-router";

import { EmailsLogo, type LogoProps, RedisLogo, StorageLogo } from "@/components/logos";
import { useInView, useReducedMotion } from "@/components/marketing/hooks";
import { Container, Eyebrow, Heading, Lede } from "@/components/marketing/section";
import { cn } from "@/lib/cn";

/**
 * Closing call to action, drawn in the same isometric language as the layer stack: a base
 * plate for "your app" with three slots, and package blocks hovering above it. Blocks drop into
 * their slot in turn, or when the matching button is hovered or focused: adding a package is
 * one Layer dropped into the app you already have.
 */

const COS = 0.866;
const SIN = 0.5;
const CX = 270;
const CY = 140;

type Point = readonly [number, number];

/** Isometric projection of plate coordinates (u along one edge, v along the other, z up). */
const at = (u: number, v: number, z: number): Point => [CX + (u - v) * COS, CY + (u + v) * SIN - z];

const poly = (points: readonly Point[]) =>
  `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;

/** Top, left and right faces of an axis-aligned box. */
function box(u: number, v: number, z: number, w: number, d: number, h: number) {
  const top = poly([
    at(u, v, z + h),
    at(u + w, v, z + h),
    at(u + w, v + d, z + h),
    at(u, v + d, z + h),
  ]);
  const left = poly([
    at(u, v + d, z + h),
    at(u + w, v + d, z + h),
    at(u + w, v + d, z),
    at(u, v + d, z),
  ]);
  const right = poly([
    at(u + w, v, z + h),
    at(u + w, v + d, z + h),
    at(u + w, v + d, z),
    at(u + w, v, z),
  ]);

  return { top, left, right };
}

/** SVG transform that maps flat (u, v) drawing onto the top face at height z. */
const plane = (z: number) => `matrix(${COS} ${SIN} ${-COS} ${SIN} ${CX} ${CY - z})`;

const BASE = { w: 350, d: 170, h: 16 };
const MODULE = { w: 72, d: 72, h: 30 };
const LIFT = 92;

interface Module {
  readonly slug: "redis" | "emails" | "storage";
  readonly Logo: ComponentType<LogoProps>;
  readonly u: number;
  readonly v: number;
  readonly soon?: boolean;
}

const modules: readonly Module[] = [
  { slug: "redis", Logo: RedisLogo, u: 24, v: 50 },
  { slug: "emails", Logo: EmailsLogo, u: 139, v: 50 },
  { slug: "storage", Logo: StorageLogo, u: 254, v: 50, soon: true },
];

function Illustration({ docked }: { readonly docked: ReadonlySet<string> }) {
  const base = box(0, 0, 0, BASE.w, BASE.d, BASE.h);

  return (
    <svg viewBox="20 20 560 380" className="h-auto w-full" aria-hidden="true">
      <g>
        <path className="ek-cta-side" d={base.left} />
        <path className="ek-cta-side-dark" d={base.right} />
        <path className="ek-cta-top" d={base.top} />
        <g transform={plane(BASE.h)}>
          <rect
            className="ek-cta-line"
            x={10}
            y={10}
            width={BASE.w - 20}
            height={BASE.d - 20}
            fill="none"
          />
          <text
            className="ek-cta-engrave font-mono text-[9px] tracking-[0.14em] uppercase"
            x={20}
            y={32}
          >
            your app
          </text>
          {[136, 144, 152].map((y, index) => (
            <path key={y} className="ek-cta-line" d={`M20 ${y}h${90 - index * 22}`} />
          ))}
          {modules.map((module) => (
            <rect
              key={module.slug}
              className={cn("ek-cta-slot", docked.has(module.slug) && "is-docked")}
              data-accent={module.slug}
              x={module.u - 4}
              y={module.v - 4}
              width={MODULE.w + 8}
              height={MODULE.d + 8}
              strokeDasharray="4 4"
            />
          ))}
        </g>
      </g>

      {modules.map((module) => {
        const faces = box(module.u, module.v, BASE.h, MODULE.w, MODULE.d, MODULE.h);
        const isDocked = docked.has(module.slug);

        return (
          <g
            key={module.slug}
            data-accent={module.slug}
            className={cn("ek-cta-module", module.soon && "is-soon", isDocked && "is-docked")}
            style={{ transform: `translateY(${isDocked ? 0 : -LIFT}px)` }}
          >
            {module.soon ? (
              <>
                <path className="ek-cta-ghost" d={faces.left} strokeDasharray="3 4" />
                <path className="ek-cta-ghost" d={faces.right} strokeDasharray="3 4" />
                <path className="ek-cta-ghost" d={faces.top} strokeDasharray="3 4" />
              </>
            ) : (
              <>
                <path className="ek-cta-module-side" d={faces.left} />
                <path className="ek-cta-module-side-dark" d={faces.right} />
                <path className="ek-cta-module-top" d={faces.top} />
              </>
            )}
            <g transform={plane(BASE.h + MODULE.h)}>
              <module.Logo
                x={module.u + 18}
                y={module.v + 18}
                width={36}
                height={36}
                className="ek-cta-logo"
              />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

const cycle: readonly (readonly string[])[] = [[], ["redis"], ["redis", "emails"], ["emails"]];

export function Closing() {
  const root = useRef<HTMLElement>(null);
  const inView = useInView(root, { threshold: 0.3 });
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [hovered, setHovered] = useState<string | undefined>();

  // Auto-cycling pauses while a button is hovered so the drawing follows the pointer instead.
  useEffect(() => {
    if (!inView || reduced || hovered) return;

    const timer = window.setInterval(() => setStep((value) => (value + 1) % cycle.length), 2200);

    return () => window.clearInterval(timer);
  }, [inView, reduced, hovered]);

  const docked = new Set<string>(
    reduced ? ["redis", "emails"] : hovered ? [hovered] : (cycle[step] ?? []),
  );

  const hover = (slug: string) => ({
    onPointerEnter: () => setHovered(slug),
    onPointerLeave: () => setHovered(undefined),
    onFocus: () => setHovered(slug),
    onBlur: () => setHovered(undefined),
  });

  return (
    <section ref={root} aria-labelledby="closing-title" className="border-t border-(--ek-line)">
      <Container className="max-w-[1400px] py-20 md:py-28">
        <div className="relative grid border border-(--ek-line) lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="ek-corners pointer-events-none absolute -inset-px" aria-hidden="true" />
          <div className="flex flex-col justify-center gap-7 p-8 md:p-14">
            <Eyebrow>Start here</Eyebrow>
            <Heading id="closing-title">Drop in one Layer and keep going.</Heading>
            <Lede>
              Install a package, provide its Layer next to the ones you already have, and yield the
              service where you need it. Nothing else in the program moves.
            </Lede>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/redis"
                title="Redis for Effect"
                data-accent="redis"
                {...hover("redis")}
                className="group inline-flex h-11 items-center gap-2.5 rounded-md bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/88 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
              >
                <RedisLogo className="size-4.5" />
                Redis for Effect
              </Link>
              <Link
                to="/emails"
                title="Emails for Effect"
                data-accent="emails"
                {...hover("emails")}
                className="group inline-flex h-11 items-center gap-2.5 rounded-md border border-(--ek-line-strong) px-4 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
              >
                <EmailsLogo className="size-4.5" />
                Emails for Effect
              </Link>
              <Link
                to="/docs"
                title="Effect Kit documentation"
                className="rounded-sm px-2 py-2 text-sm text-fd-muted-foreground underline decoration-(--ek-line-strong) underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-foreground focus-visible:outline-2 focus-visible:outline-fd-ring"
              >
                Read the docs
              </Link>
            </div>
          </div>
          <div className="ek-dotted flex items-center justify-center border-t border-(--ek-line) px-6 py-10 lg:border-t-0 lg:border-s">
            <Illustration docked={docked} />
          </div>
        </div>
      </Container>
    </section>
  );
}
