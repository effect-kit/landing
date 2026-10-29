import { useEffect, useId, useRef, useState } from "react";

import { useInView, useReducedMotion } from "@/components/marketing/hooks";
import { isoProjector } from "@/components/marketing/iso";
import { cn } from "@/lib/cn";

import { type Engine, EngineMark, engines as allEngines } from "./engines";

/**
 * Hero illustration: one isometric server per supported backend, standing on a shared bus.
 * A request travels along the bus and the server it reaches lights up in the page colour,
 * so the row reads as "one client, any of these".
 */

const STEP = 78; // spacing along the row, in plate units
const SIZE = 58;
const HEIGHT = 34;
const { at, box, plane } = isoProjector(110, 72);

/** Servers sit on a horizontal screen line: u grows while v shrinks by the same amount. */
const origin = (index: number) => ({ u: index * STEP, v: -index * STEP });

const CYCLE = 1400;

// The front corner of every base sits on one screen line; the bus runs just below it.
const front = (index: number) => {
  const { u, v } = origin(index);

  return at(u + SIZE + 6, v + SIZE + 6, 0);
};

export function EngineRail({
  className,
  items = allEngines,
  offset = 0,
}: {
  readonly className?: string;
  /** Servers to draw; phones get two rails of four. */
  readonly items?: readonly Engine[];
  /** Delay the tour so stacked rails light up one after another. */
  readonly offset?: number;
}) {
  const engines = items;
  const titleId = useId();
  const root = useRef<SVGSVGElement>(null);
  const inView = useInView(root, { threshold: 0.2 });
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  const total = allEngines.length;
  const active = (tick + total - offset) % total;

  useEffect(() => {
    if (!inView || reduced) return;

    const timer = window.setInterval(() => setTick((value) => (value + 1) % total), CYCLE);

    return () => window.clearInterval(timer);
  }, [inView, reduced, total]);

  const busY = front(0)[1] + 26;
  const busStart = front(0)[0];
  const busEnd = front(engines.length - 1)[0];
  const lit = active < engines.length ? active : -1;
  const tapX = front(Math.max(lit, 0))[0];

  return (
    <svg
      ref={root}
      viewBox={`-40 -24 ${(244 + (engines.length - 1) * 135.1).toFixed(0)} 250`}
      className={cn("h-auto w-full", className)}
      aria-labelledby={titleId}
    >
      <title id={titleId}>
        {`Supported backends: ${engines.map((engine) => engine.name).join(", ")}.`}
      </title>
      <path className="ek-rail-bus" d={`M${busStart - 70} ${busY}H${busEnd + 70}`} />
      <circle
        className={cn("ek-rail-packet", lit < 0 && "opacity-0")}
        r={4}
        cx={tapX}
        cy={busY}
        style={{ transition: reduced ? "none" : `cx ${CYCLE * 0.6}ms var(--ease-out-expo)` }}
      />
      {engines.map((engine, index) => {
        const { u, v } = origin(index);
        const base = box(u - 6, v - 6, 0, SIZE + 12, SIZE + 12, 6);
        const body = box(u, v, 6, SIZE, SIZE, HEIGHT);
        const isLit = index === lit;
        const [fx, fy] = front(index);
        const led = at(u + SIZE, v + 10, 6 + HEIGHT - 8);

        return (
          <g key={engine.name} className={cn("ek-rail-server", isLit && "is-lit")}>
            <path className="ek-rail-tap" d={`M${fx} ${fy}V${busY}`} />
            <path className="ek-rail-side" d={base.left} />
            <path className="ek-rail-side-dark" d={base.right} />
            <path className="ek-rail-top" d={base.top} />
            <path className="ek-rail-side" d={body.left} />
            <path className="ek-rail-side-dark" d={body.right} />
            <path className="ek-rail-top ek-rail-face" d={body.top} />
            {[12, 20, 28].map((z) => {
              const a = at(u + 8, v + SIZE, 6 + z);
              const b = at(u + SIZE - 8, v + SIZE, 6 + z);

              return (
                <path key={z} className="ek-rail-vent" d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} />
              );
            })}
            <circle className="ek-rail-led" cx={led[0]} cy={led[1]} r={2.2} />
            <g transform={plane(6 + HEIGHT)}>
              <EngineMark
                mark={engine.mark}
                x={u + SIZE / 2 - 19}
                y={v + SIZE / 2 - 19}
                size={38}
                className="ek-rail-mark"
              />
            </g>
            <text
              className="ek-rail-label font-mono text-[11px]"
              x={fx}
              y={busY + 26}
              textAnchor="middle"
            >
              {engine.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
