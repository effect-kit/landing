import { useEffect, useRef, useState } from "react";

import { BrandIcon } from "@/components/brands/brand-icon";
import { useInView, useReducedMotion } from "@/components/marketing/hooks";
import { emailProviders } from "@/content/email-providers";
import { cn } from "@/lib/cn";

/**
 * Hero illustration: a sorting wall with one pigeonhole per provider. An envelope flies in
 * from the left and drops into a different hole each time; the same message, any provider.
 */

const COLS = 4;
const CELL = 112;
const GAP = 10;
const DEPTH = 9;
const ROWS = Math.ceil(emailProviders.length / COLS);
const W = COLS * CELL + (COLS - 1) * GAP;
const H = ROWS * CELL + (ROWS - 1) * GAP;
const PAD = 70;

/** Shuffled but fixed, so the envelope wanders across the wall instead of reading left to right. */
const order = [0, 6, 13, 3, 9, 14, 1, 11, 4, 15, 7, 2, 12, 8, 5, 10].filter(
  (index) => index < emailProviders.length,
);

const cellOrigin = (index: number) => ({
  x: PAD + (index % COLS) * (CELL + GAP),
  y: 24 + Math.floor(index / COLS) * (CELL + GAP),
});

const FLIGHT = 950;
const DWELL = 900;

function Envelope() {
  return (
    <g className="ek-hole-envelope">
      <rect x={-26} y={-17} width={52} height={34} rx={3} />
      <path d="M-26 -15L0 4L26 -15" fill="none" />
    </g>
  );
}

export function Pigeonholes({ className }: { readonly className?: string }) {
  const root = useRef<SVGSVGElement>(null);
  const flyer = useRef<SVGGElement>(null);
  const inView = useInView(root, { threshold: 0.25 });
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [landed, setLanded] = useState(-1);

  const target = order[step % order.length] ?? 0;

  useEffect(() => {
    if (!inView || reduced) return;

    const element = flyer.current;
    const { x, y } = cellOrigin(target);
    const end = { x: x + CELL / 2, y: y + CELL / 2 + 6 };
    const start = { x: -30, y: H * 0.62 };
    const peak = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 70 };

    const animation = element?.animate(
      [
        { transform: `translate(${start.x}px, ${start.y}px) scale(1) rotate(-8deg)`, opacity: 0 },
        {
          transform: `translate(${start.x + 30}px, ${start.y - 10}px) scale(1) rotate(-6deg)`,
          opacity: 1,
          offset: 0.12,
        },
        {
          transform: `translate(${peak.x}px, ${peak.y}px) scale(1.05) rotate(4deg)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(${end.x}px, ${end.y}px) scale(0.62) rotate(0deg)`,
          opacity: 1,
          offset: 0.92,
        },
        { transform: `translate(${end.x}px, ${end.y}px) scale(0.5) rotate(0deg)`, opacity: 0 },
      ],
      { duration: FLIGHT, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" },
    );

    const land = window.setTimeout(() => setLanded(target), FLIGHT * 0.9);
    const next = window.setTimeout(() => setStep((value) => value + 1), FLIGHT + DWELL);

    return () => {
      animation?.cancel();
      window.clearTimeout(land);
      window.clearTimeout(next);
    };
  }, [target, inView, reduced]);

  return (
    <svg
      ref={root}
      viewBox={`0 0 ${W + PAD + 24} ${H + 70}`}
      className={cn("h-auto w-full", className)}
      aria-labelledby="pigeonholes-title"
    >
      <title id="pigeonholes-title">
        {`One message, sorted into any of ${emailProviders.length} providers: ${emailProviders
          .map((provider) => provider.name)
          .join(", ")}.`}
      </title>
      <rect x={PAD - 14} y={10} width={W + 28} height={H + 28} rx={14} className="ek-hole-frame" />
      {emailProviders.map((provider, index) => {
        const { x, y } = cellOrigin(index);
        const lit = index === landed && !reduced;

        return (
          <g
            key={provider.id}
            className={cn("ek-hole", lit && "is-lit")}
            data-provider={provider.id}
          >
            <rect x={x} y={y} width={CELL} height={CELL} rx={6} className="ek-hole-back" />
            {/* Inner walls: top and left fall into shadow so each hole reads as a box. */}
            <path
              className="ek-hole-shade"
              d={`M${x} ${y}h${CELL}l-${DEPTH} ${DEPTH}H${x + DEPTH}v${CELL - DEPTH * 2}l-${DEPTH} ${DEPTH}z`}
            />
            <rect x={x} y={y} width={CELL} height={CELL} rx={6} className="ek-hole-edge" />
            {provider.brand ? (
              <BrandIcon
                brand={provider.brand}
                label=""
                x={x + CELL / 2 - 15}
                y={y + CELL / 2 - 22}
                width={30}
                height={30}
                className="ek-hole-mark"
              />
            ) : (
              <text
                x={x + CELL / 2}
                y={y + CELL / 2}
                textAnchor="middle"
                className="ek-hole-letter font-mono text-[22px]"
              >
                {provider.name.charAt(0)}
              </text>
            )}
            <text
              x={x + CELL / 2}
              y={y + CELL - 16}
              textAnchor="middle"
              className="ek-hole-name font-mono text-[10px]"
            >
              {provider.name.length > 15 ? `${provider.name.slice(0, 14)}…` : provider.name}
            </text>
          </g>
        );
      })}
      <g ref={flyer} style={{ opacity: 0 }}>
        <Envelope />
      </g>
    </svg>
  );
}
