"use client";

import * as React from "react";

import { iso, type SolidPaths } from "@/components/iso/iso-kit";

import { WHEEL_PITCH } from "./art";
import { BEAD_SCREEN_R, COUNTER } from "./geometry";
import { pointOf, type Bead } from "./model";
import { P } from "./view";

/** Pieces the live figure rewrites every frame: moving solids, beads and counter wheels. */

/** Screen x where a bead passes from the client half to the server half of the line. */
export const SPLIT_X = 48;

/* ---------- solids whose shape changes ---------- */

export interface SolidNodes {
  fill: SVGPathElement | null;
  shades: (SVGPathElement | null)[];
  top: SVGPathElement | null;
  crease: SVGPathElement | null;
  edge: SVGPathElement | null;
}

export const solidNodes = (): SolidNodes => ({
  fill: null,
  shades: [null, null, null, null],
  top: null,
  crease: null,
  edge: null,
});

export function writeSolid(nodes: SolidNodes, paths: SolidPaths) {
  nodes.fill?.setAttribute("d", paths.fill);
  paths.shades.forEach((d, index) => nodes.shades[index]?.setAttribute("d", d));
  nodes.top?.setAttribute("d", paths.top);
  nodes.crease?.setAttribute("d", paths.crease);
  nodes.edge?.setAttribute("d", paths.outline);
}

/** `nodes` is read only from ref callbacks, so the solid can be rewritten per frame without re-rendering. */
export function MovingSolid({
  nodes,
  paths,
  tone,
  className,
}: {
  nodes: () => SolidNodes;
  paths: SolidPaths;
  tone: "hi" | "mid";
  className?: string;
}) {
  return (
    <g className={className ? `iso-solid ${className}` : "iso-solid"}>
      <path ref={(node) => void (nodes().fill = node)} className="iso-fill" d={paths.fill} />
      {[0, 1, 2, 3].map((index) => (
        <path
          key={index}
          ref={(node) => void (nodes().shades[index] = node)}
          className="iso-shade"
          data-shade={index}
          d={paths.shades[index] ?? ""}
        />
      ))}
      <path ref={(node) => void (nodes().top = node)} className="iso-top" d={paths.top} />
      <path
        ref={(node) => void (nodes().crease = node)}
        className="iso-line iso-crease"
        data-tone="faint"
        d={paths.crease}
      />
      <path
        ref={(node) => void (nodes().edge = node)}
        className="iso-line iso-edge"
        data-tone={tone}
        d={paths.outline}
      />
    </g>
  );
}

/* ---------- beads ---------- */

export const fine = (n: number) => Math.round(n * 100) / 100;

export function placeBead(node: SVGGElement | null, item: Bead, angle: number, slot: 1 | 2) {
  if (!node) return;
  const mine = slot === 1 ? item.x < SPLIT_X : item.x >= SPLIT_X;
  const alpha = item.alive && mine ? item.alpha : 0;
  if (alpha <= 0) {
    if (node.style.opacity !== "0") node.style.opacity = "0";
    return;
  }
  const [x, y] = iso(pointOf(item.x, angle), P);
  node.setAttribute("transform", `translate(${fine(x)} ${fine(y)})`);
  node.style.opacity = `${fine(alpha)}`;
}

export function restTransform(item: Bead) {
  const [x, y] = iso(pointOf(item.x, 0), P);
  return `translate(${fine(x)} ${fine(y)})`;
}

export const R = BEAD_SCREEN_R;

export function CommandBead({ bind, x }: { bind: (node: SVGGElement | null) => void; x: number }) {
  return (
    <g
      ref={bind}
      className="rw-bead"
      transform={restTransform({ x, alpha: 1, alive: true, orphan: false })}
      style={{ opacity: x < SPLIT_X ? 1 : 0 }}
    >
      <circle className="rw-bead-body" r={R} />
      <path
        className="rw-bead-shade"
        d={`M${fine(-R * 0.86)} ${fine(R * 0.5)}A${R} ${R} 0 0 0 ${fine(R * 0.86)} ${fine(R * 0.5)}A${fine(R * 1.15)} ${fine(R * 1.15)} 0 0 1 ${fine(-R * 0.86)} ${fine(R * 0.5)}Z`}
      />
      <ellipse
        className="rw-bead-shine"
        cx={fine(-R * 0.34)}
        cy={fine(-R * 0.38)}
        rx={fine(R * 0.3)}
        ry={fine(R * 0.2)}
      />
      <circle className="rw-bead-edge" r={R} />
    </g>
  );
}

export function ReplyBead({ bind }: { bind: (node: SVGGElement | null) => void }) {
  return (
    <g ref={bind} className="rw-reply" style={{ opacity: 0 }}>
      <circle className="rw-reply-body" r={R * 0.92} />
      <circle className="rw-reply-core" r={R * 0.36} />
    </g>
  );
}

/* ---------- the counter ---------- */

export function wheelPositions(roll: number) {
  const out: number[] = [];
  const whole = Math.floor(roll);
  const fraction = roll - whole;
  for (let index = 0; index < COUNTER.wheels; index++) {
    const power = 10 ** index;
    const digit = Math.floor(whole / power) % 10;
    const carrying = index === 0 || whole % power === power - 1;
    out.push(digit + (carrying ? fraction : 0));
  }
  return out.toReversed();
}

export const WINDOW_H = COUNTER.z1 - COUNTER.z0;
export const DIGIT_SIZE = 8.2;
export const wheelShift = (position: number) => `translate(0 ${fine(-position * WHEEL_PITCH)})`;

/* ---------- the live figure ---------- */
