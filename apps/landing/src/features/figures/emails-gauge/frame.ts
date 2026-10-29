import {
  extrude,
  iso,
  joinPaths,
  lineOnTop,
  pathOf,
  planOutline,
  type Plan,
  type Plane,
  type Point3,
} from "@/components/iso/iso-kit";

import { CAP_FACE, CAP_R, detentAngle, SKIRT_H, SKIRT_R } from "./geometry";
import { boxOf, onCap } from "./solids";
import {
  DIAL,
  DIAL_PLATE_R,
  FLAG_FROM,
  FLAG_HINGE,
  FLAG_T,
  FLAG_WIDTH,
  KNOB_R,
  KNOB_TOP,
  KNOB_Z,
  LETTER_D,
  LETTER_W,
  MAST_L,
  MAST_W,
  P,
  ROLLER_Z,
  ROLLERS,
} from "./view";

/* ---------- Letter, built centred on the origin with its underside at z = 0 ---------- */

const LETTER: Plan = { x: -LETTER_W / 2, y: -LETTER_D / 2, w: LETTER_W, d: LETTER_D, r: 1.2 };
const X0 = LETTER.x;

function uLoop(from: number, reach: number, y0: number, y1: number, z: number) {
  const r = (y1 - y0) / 2;
  const points: Plane[] = [[from, y0]];
  for (let step = 0; step <= 10; step++) {
    const a = -Math.PI / 2 + (Math.PI * step) / 10;
    points.push([from + reach + r * Math.cos(a), y0 + r + r * Math.sin(a)]);
  }
  points.push([from, y1]);
  return pathOf(points.map(([x, y]) => iso([x, y, z], P)));
}

export function letterOf(h: number) {
  const top = h;
  const stamp: Plan = { x: LETTER.x + 4, y: LETTER.y + 4, w: 9, d: 10, r: 0.4 };
  return {
    body: extrude(
      // The kit's rounded plan, extruded: the envelope's paper edge.
      (() => {
        const ring: Plane[] = [];
        const { x, y, w, d, r } = LETTER;
        const corners: [number, number, number][] = [
          [x + w - r, y + r, -90],
          [x + w - r, y + d - r, 0],
          [x + r, y + d - r, 90],
          [x + r, y + r, 180],
        ];
        for (const [cx, cy, start] of corners) {
          for (let step = 0; step <= 3; step++) {
            const a = ((start + 30 * step) * Math.PI) / 180;
            ring.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
          }
        }
        return ring;
      })(),
      0,
      h,
      P,
      { bevel: 0.5 },
    ),
    stamp: joinPaths([
      planOutline(stamp, top, P, 1),
      planOutline(
        { x: stamp.x + 1.4, y: stamp.y + 1.4, w: stamp.w - 2.8, d: stamp.d - 2.8, r: 0.2 },
        top,
        P,
        1,
      ),
    ]),
    address: joinPaths([
      lineOnTop([-6, 2], [16, 2], top, P),
      lineOnTop([-6, 6], [12, 6], top, P),
      lineOnTop([-6, 10], [8, 10], top, P),
    ]),
    clip: joinPaths([uLoop(X0, 12.4, 4.6, 9.8, top), uLoop(X0, 9.6, 6, 8.4, top)]),
  };
}

const scale = (v: Point3, by: number): Point3 => [v[0] * by, v[1] * by, v[2] * by];

/* ---------- Reject flag: an arm and plate that stand up about a hinge along x ---------- */

export function flagOf(angle: number) {
  const d: Point3 = [0, Math.cos(angle), Math.sin(angle)];
  const e: Point3 = [-1, 0, 0];
  const n: Point3 = [0, -Math.sin(angle), Math.cos(angle)];
  const [hx, hy, hz] = FLAG_HINGE;
  const at = (s: number, t: number): Point3 => [
    hx + d[0] * s + e[0] * t - (n[0] * FLAG_T) / 2,
    hy + d[1] * s + e[1] * t - (n[1] * FLAG_T) / 2,
    hz + d[2] * s + e[2] * t - (n[2] * FLAG_T) / 2,
  ];
  return {
    mast: boxOf(at(-1, -MAST_W / 2), scale(d, MAST_L + 1), scale(e, MAST_W), scale(n, FLAG_T), P),
    plate: boxOf(
      at(FLAG_FROM, MAST_W / 2),
      scale(d, MAST_L - FLAG_FROM),
      scale(e, FLAG_WIDTH),
      scale(n, FLAG_T),
      P,
    ),
  };
}

/* ---------- Dial pointer: a ridge on the knob, turned to the chosen detent ---------- */

export function pointerOf(angle: number) {
  const along: Plane = [Math.cos(angle), Math.sin(angle)];
  const across: Plane = [-along[1], along[0]];
  const point = (s: number, t: number): Plane => [
    DIAL[0] + along[0] * s + across[0] * t,
    DIAL[1] + along[1] * s + across[1] * t,
  ];
  const ring = [
    point(SKIRT_R - 0.6, -1.1),
    point(DIAL_PLATE_R - 1.9, -0.35),
    point(DIAL_PLATE_R - 1.9, 0.35),
    point(SKIRT_R - 0.6, 1.1),
  ];
  return {
    tab: extrude(ring, KNOB_Z, SKIRT_H, P, { bevel: 0.2 }),
    index: lineOnTop(point(1.6, 0), point(KNOB_R - 0.25, 0), KNOB_TOP, P),
  };
}

export const pointerAngle = (station: number) => detentAngle(station - 2);

/* ---------- Roller index marks on the end caps ---------- */

export function marksOf(roll: number) {
  return joinPaths(
    ROLLERS.map((x) =>
      pathOf([
        iso(onCap(x, ROLLER_Z, 0.6, CAP_FACE, -roll), P),
        iso(onCap(x, ROLLER_Z, CAP_R - 0.3, CAP_FACE, -roll), P),
      ]),
    ),
  );
}
