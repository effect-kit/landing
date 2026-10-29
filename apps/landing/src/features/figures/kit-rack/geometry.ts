import {
  cameraOf,
  circleRing,
  cylinder,
  insetPlan,
  knurl,
  lineOnTop,
  onTop,
  pathOf,
  planOutline,
  ring,
  sideArc,
  sideRing,
  sideSeam,
  slabOf,
  topMatrix,
  type Flat,
  type Plan,
  type Point3,
} from "@/components/iso/iso-kit";

import { DETENT, LAYERS, type Selector } from "./model";
import {
  BARREL_Z,
  BOOT_TOP,
  BOOT_Z,
  CAP_H,
  CAP_R,
  CHEEK,
  CHEEK_TOP,
  CHEEK_Z0,
  DEPTH,
  DETENT_IN,
  DETENT_OUT,
  FOOT_H,
  INNER,
  JACK_Y,
  KNOB_H,
  KNOB_R,
  KNOB_TOP,
  KNOB_Y,
  KNOB_Z,
  LED_Y,
  MODULES,
  NUT_H,
  OUT_JACK,
  P,
  PANEL_TOP,
  PANEL_Y,
  PANEL_Z,
  PANEL_H,
  RAIL_TOP,
  RAIL_W,
  SKIRT_H,
  SKIRT_R,
  SLEEVE_Z,
  TUB_Z,
  at,
  centreOf,
  moduleOf,
  panelPlan,
  polar,
  type Module,
} from "./view";

const slab = (plan: Plan, z: number, h: number, steps = 4, bevel = 0) =>
  slabOf(plan, z, h, P, steps, bevel);
const round = (cx: number, cy: number, r: number, z: number, h: number, steps = 32) =>
  cylinder(cx, cy, r, z, h, P, steps);
const join = (paths: string[]) => paths.filter(Boolean).join("");
const fine = (value: number) => Math.round(value * 10) / 10;
const flat = ([x, y]: Flat): Flat => [fine(x), fine(y)];

/** World units to screen units, for strokes that stand for real thickness (cables). */
export const UNIT = cameraOf(P).k;

// ---------------------------------------------------------------------------
// Case
// ---------------------------------------------------------------------------

const TUB: Plan = { x: -INNER, y: -DEPTH, w: INNER * 2, d: DEPTH * 2, r: 0 };
const cheekPlan = (side: -1 | 1): Plan => ({
  x: side < 0 ? -INNER - CHEEK : INNER,
  y: -DEPTH - 2,
  w: CHEEK,
  d: DEPTH * 2 + 4,
  r: 2.5,
});
const FEET: [number, number][] = [-1, 1].flatMap((sx) =>
  [-1, 1].map((sy) => [sx * (INNER + CHEEK / 2), sy * (DEPTH - 8)] as [number, number]),
);
const footDepth = ([x, y]: [number, number]) =>
  x * Math.cos((58 * Math.PI) / 180) + y * Math.sin((58 * Math.PI) / 180);

const RAILS: Plan[] = [-1, 1].map((side) => ({
  x: -INNER,
  y: side < 0 ? -DEPTH : DEPTH - RAIL_W,
  w: INNER * 2,
  d: RAIL_W,
  r: 0.6,
}));
const HP = 5.08;
const holeRow = (y: number) =>
  join(
    Array.from({ length: Math.floor((INNER * 2 - 4) / HP) + 1 }, (_, index) =>
      ring(-INNER + 2 + HP / 2 + index * HP, y, 0.55, RAIL_TOP, P, 10),
    ),
  );

const cheekTop = (side: -1 | 1) => planOutline(insetPlan(cheekPlan(side), 1.6), CHEEK_TOP, P, 4);
const SOCKET: Plan = { x: INNER + CHEEK, y: -7, w: 1.2, d: 14, r: 1 };
const SOCKET_X = INNER + CHEEK + 1.2;

export const CASE_ART = {
  halo: slab(
    insetPlan(
      { x: -INNER - CHEEK, y: -DEPTH - 2, w: (INNER + CHEEK) * 2, d: DEPTH * 2 + 4, r: 3 },
      2,
    ),
    CHEEK_Z0 - FOOT_H,
    2,
  ).fill,
  feet: FEET.toSorted((a, b) => footDepth(a) - footDepth(b)).map(([x, y]) => ({
    key: `${x},${y}`,
    flange: round(x, y, 3.4, CHEEK_Z0 - FOOT_H, 1, 28),
    foot: round(x, y, 2.7, CHEEK_Z0 - FOOT_H + 1, FOOT_H - 1, 24),
  })),
  leftCheek: slab(cheekPlan(-1), CHEEK_Z0, CHEEK_TOP - CHEEK_Z0, 4, 0.8),
  leftCheekTop: cheekTop(-1),
  tub: slab(TUB, TUB_Z, -TUB_Z, 2, 0),
  tubSeam: sideSeam(TUB, TUB_Z + 4, P, 2),
  rails: RAILS.map((plan) => ({ key: `${plan.y}`, paths: slab(plan, 0, RAIL_TOP, 3, 0.4) })),
  holes: join([-1, 1].map((side) => holeRow(side * (PANEL_Y + (DEPTH - PANEL_Y) / 2)))),
  rightCheek: slab(cheekPlan(1), CHEEK_Z0, CHEEK_TOP - CHEEK_Z0, 4, 0.8),
  rightCheekTop: cheekTop(1),
  cheekScrews: [-1, 1].flatMap((sy) =>
    [CHEEK_TOP - 5, CHEEK_Z0 + 5].map((z) => at([INNER + CHEEK, sy * (DEPTH - 6), z])),
  ),
  socket: slab(SOCKET, -11, 12, 3, 0.3),
  socketRings: join([
    sideRing([SOCKET_X, 0, -5], 3.2, "x", P, 28),
    sideRing([SOCKET_X, 0, -5], 1.3, "x", P, 16),
  ]),
  socketPin: at([SOCKET_X, 0, -5]),
};

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

const SCREW_R = 1.5;
const SCREW_H = 0.9;
const RADIANS = Math.PI / 180;

function screw(x: number, y: number, turn: number) {
  const top = PANEL_TOP + SCREW_H;
  const r = SCREW_R - 0.35;
  const dx = Math.cos(turn * RADIANS) * r;
  const dy = Math.sin(turn * RADIANS) * r;
  return {
    key: `${x},${y}`,
    head: round(x, y, SCREW_R, PANEL_TOP, SCREW_H, 20),
    slot: lineOnTop([x - dx, y - dy], [x + dx, y + dy], top, P),
  };
}

const screwsOf = ({ x0, x1 }: Module, seed: number) =>
  [
    [x0 + 4.2, -PANEL_Y + 3.4],
    [x1 - 4.2, -PANEL_Y + 3.4],
    [x0 + 4.2, PANEL_Y - 3.4],
    [x1 - 4.2, PANEL_Y - 3.4],
  ].map(([x, y], index) => screw(x ?? 0, y ?? 0, (seed * 37 + index * 61) % 180));

export const PANEL_ART = MODULES.map((module, index) => ({
  key: module.key,
  slab: slab(panelPlan(module), PANEL_Z, PANEL_H, 3, 0.4),
  screws: screwsOf(module, index + 1),
}));

/** A hex nut where each jack comes through the panel. */
const nut = (x: number) => ({
  key: `${x}`,
  body: cylinder(x, JACK_Y, 3.1, PANEL_TOP, NUT_H, P, 6),
  face: ring(x, JACK_Y, 2.3, PANEL_TOP + NUT_H, P, 20),
});

// Program: a code window behind a bezel, an engraved label and two output jacks. No controls.
const program = moduleOf("program");
const BEZEL: Plan = { x: program.x0 + 7, y: -35, w: program.x1 - program.x0 - 14, d: 24, r: 1.8 };
const WINDOW = insetPlan(BEZEL, 2.6);
const CODE_ROWS: [number, number][] = [
  [0, 0.82],
  [3, 0.62],
  [3, 0.7],
  [3, 0.46],
  [0, 0.12],
];
const codeRule = () => {
  const left = WINDOW.x + 2.6;
  const width = WINDOW.w - 5.2;
  return join(
    CODE_ROWS.map(([indent, share], row) => {
      const y = WINDOW.y + 3.2 + row * ((WINDOW.d - 6.4) / (CODE_ROWS.length - 1));
      return lineOnTop(
        [left + indent, y],
        [left + indent + (width - indent) * share, y],
        PANEL_TOP + 1.2,
        P,
      );
    }),
  );
};
const RULE_Y = 1;

export const PROGRAM_ART = {
  bezel: slab(BEZEL, PANEL_TOP, 1.2, 4, 0.4),
  window: slab(WINDOW, PANEL_TOP + 1.2, 0.01, 4).fill,
  windowEdge: planOutline(WINDOW, PANEL_TOP + 1.2, P, 4),
  code: codeRule(),
  rule: lineOnTop([program.x0, RULE_Y], [program.x1, RULE_Y], PANEL_TOP, P),
  label: topMatrix([(program.x0 + program.x1) / 2, RULE_Y - 4.2], PANEL_TOP, P, "x"),
  nuts: Object.values(OUT_JACK).map(nut),
};

// Selectors: detent marks on an arc, a skirted knurled knob, an LED and the input jack.
const arcOf = (cx: number, cy: number, radius: number, from: number, to: number) => {
  const steps = Math.max(8, Math.round(Math.abs(to - from) / 4));
  return onTop(
    Array.from({ length: steps + 1 }, (_, step) =>
      polar(cx, cy, radius, from + ((to - from) * step) / steps),
    ),
    PANEL_TOP,
    P,
  );
};

function selectorArt(selector: Selector) {
  const cx = centreOf(selector);
  const { step, first } = DETENT[selector];
  const count = LAYERS[selector].length;
  const last = first + step * (count - 1);
  return {
    key: selector,
    arc: arcOf(cx, KNOB_Y, DETENT_IN, first, last),
    detents: Array.from({ length: count }, (_, index) =>
      lineOnTop(
        polar(cx, KNOB_Y, DETENT_IN, first + step * index),
        polar(cx, KNOB_Y, DETENT_OUT, first + step * index),
        PANEL_TOP,
        P,
      ),
    ),
    stopDots: [first - step * 0.5, last + step * 0.5].map((angle) => {
      const [x, y] = polar(cx, KNOB_Y, DETENT_IN, angle);
      return at([x, y, PANEL_TOP]);
    }),
    skirt: round(cx, KNOB_Y, SKIRT_R, PANEL_TOP, SKIRT_H, 48),
    skirtBand: sideArc(cx, KNOB_Y, SKIRT_R, PANEL_TOP + SKIRT_H * 0.45, P, 32),
    knob: round(cx, KNOB_Y, KNOB_R, KNOB_Z, KNOB_H, 48),
    knurl: knurl(cx, KNOB_Y, KNOB_R, KNOB_Z, KNOB_Z + KNOB_H, 44, P, 0.2),
    cap: round(cx, KNOB_Y, CAP_R, KNOB_Z + KNOB_H, CAP_H, 40),
    capRing: ring(cx, KNOB_Y, CAP_R - 1.3, KNOB_TOP, P, 32),
    ledBezel: round(cx, LED_Y, 2.7, PANEL_TOP, 0.8, 24),
    lens: round(cx, LED_Y, 1.8, PANEL_TOP + 0.8, 1.1, 24),
    lensTop: onTop(circleRing(cx, LED_Y, 1.8, 24), PANEL_TOP + 1.9, P, true),
    glow: flat(at([cx, LED_Y, PANEL_TOP + 1.9])),
    nut: nut(cx),
  };
}

export const SELECTOR_ART = { redis: selectorArt("redis"), emails: selectorArt("emails") };

// Blank cover: the reserved slot for Storage, a plain panel with vent slots.
const blank = moduleOf("blank");
export const BLANK_ART = {
  vents: join(
    Array.from({ length: 5 }, (_, row) =>
      planOutline(
        { x: blank.x0 + 9, y: -14 + row * 7, w: blank.x1 - blank.x0 - 18, d: 2.4, r: 1.2 },
        PANEL_TOP,
        P,
        4,
      ),
    ),
  ),
};

// ---------------------------------------------------------------------------
// Plugs and patch cables
// ---------------------------------------------------------------------------

function plug(x: number) {
  return {
    x,
    barrel: round(x, JACK_Y, 2.1, BARREL_Z, SLEEVE_Z - BARREL_Z, 24),
    sleeve: round(x, JACK_Y, 2.7, SLEEVE_Z, BOOT_Z - SLEEVE_Z, 28),
    knurl: knurl(x, JACK_Y, 2.7, SLEEVE_Z, BOOT_Z, 18, P, 0.2),
    boot: round(x, JACK_Y, 1.9, BOOT_Z, BOOT_TOP - BOOT_Z, 24),
    bootRing: sideArc(x, JACK_Y, 1.9, BOOT_Z + 1.2, P, 16),
  };
}

export const PLUGS = [...Object.values(OUT_JACK), centreOf("redis"), centreOf("emails")]
  .toSorted((a, b) => a - b)
  .map(plug);

const CABLE_R = 1;
export const CABLE_WIDTH = fine(CABLE_R * 2 * UNIT);

function bezier(a: Point3, b: Point3, c: Point3, d: Point3, t: number): Point3 {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
  const mix = (axis: 0 | 1 | 2) =>
    w[0] * a[axis] + w[1] * b[axis] + w[2] * c[axis] + w[3] * d[axis];
  return [mix(0), mix(1), mix(2)];
}

function cable(from: number, to: number, rise: number, bulge: number) {
  const a: Point3 = [from, JACK_Y, BOOT_TOP];
  const d: Point3 = [to, JACK_Y, BOOT_TOP];
  const lean = (to - from) * 0.14;
  const b: Point3 = [from + lean, JACK_Y + bulge, BOOT_TOP + rise];
  const c: Point3 = [to - lean, JACK_Y + bulge, BOOT_TOP + rise];
  const points = Array.from({ length: 65 }, (_, step) => flat(at(bezier(a, b, c, d, step / 64))));
  return { d: pathOf(points), points };
}

export const CABLES: Record<Selector, { d: string; points: Flat[] }> = {
  redis: cable(OUT_JACK.redis, centreOf("redis"), 14, 9),
  emails: cable(OUT_JACK.emails, centreOf("emails"), 14, 9),
};
