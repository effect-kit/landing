import {
  corners,
  cylinder,
  depthOf,
  haloOf,
  insetPlan,
  iso,
  joinPaths,
  knurl,
  lineOnTop,
  pathOf,
  planOutline,
  pointsAt,
  ring,
  sideArc,
  sideMatrix,
  sideSeam,
  slabOf,
  topMatrix,
  type Flat,
  type Plan,
  type Point3,
} from "@/components/iso/iso-kit";

import { barX, barY } from "./solids";
import {
  BED_Z,
  BLADE_H,
  BLADE_W,
  BLADE_X,
  BLADE_Y1,
  BRIDGE,
  BRIDGE_H,
  BRIDGE_TOP,
  BRIDGE_Z,
  CHEEK_D,
  CHEEK_H,
  CHEEK_X0,
  CHEEK_X1,
  CHEEK_Y,
  COUNTER,
  COUNTER_H,
  DETENT,
  DIAL,
  DIAL_PLATE_H,
  DIAL_PLATE_R,
  DIAL_Z,
  FEELER_X,
  FENCE_X,
  FLAG_HINGE,
  FLAG_WIDTH,
  MAST_L,
  MAST_W,
  FOOT_H,
  GAP_NARROW,
  GAP_WIDE,
  GATE_BED,
  GUIDE_H,
  KNOB_H,
  KNOB_R,
  KNOB_Z,
  OUT,
  OUT_FLOOR,
  OUT_WALL,
  P,
  PLATE,
  PLATE_H,
  POST_D,
  POST_H,
  POST_W,
  POST_X,
  POST_Y,
  ROD_L,
  ROD_R,
  ROD_Y,
  ROLLER_R,
  ROLLER_Z,
  ROLLERS,
  TRAY,
  WHEEL_R,
  WHEEL_Y0,
  WHEEL_Y1,
} from "./view";

const byDepth = (points: [number, number][]) =>
  points.toSorted((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));
const on = (points: Point3[]) => pointsAt(points, P);
const box = (plan: Plan, z: number, h: number, steps = 3, bevel = 0.5) =>
  slabOf(plan, z, h, P, steps, bevel);

/* ---------- Bench ---------- */

export const BASE_ART = {
  halo: haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H + FOOT_H, P),
  feet: byDepth(corners(PLATE, 22)).map(
    ([x, y]) =>
      [
        cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28),
        cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28),
      ] as const,
  ),
  slab: slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6),
  seam: sideSeam(PLATE, -PLATE_H + 3, P, 8),
  groove: planOutline(insetPlan(PLATE, 5), 0, P),
  screwRings: joinPaths(corners(PLATE, 10).map(([x, y]) => ring(x, y, 2.2, 0, P, 16))),
  screws: on(corners(PLATE, 10).map(([x, y]): Point3 => [x, y, 0])),
};

/* Name plate on the bench, the figure's one engraved label. */
const NAME: Plan = { x: 72, y: 40, w: 56, d: 12, r: 1.4 };
export const NAME_ART = {
  plate: box(NAME, 0, 0.8, 4, 0),
  inset: planOutline(insetPlan(NAME, 1.6), 0.8, P),
  screws: on([
    [NAME.x + 3.2, NAME.y + NAME.d / 2, 0.8],
    [NAME.x + NAME.w - 3.2, NAME.y + NAME.d / 2, 0.8],
  ]),
  label: topMatrix([NAME.x + NAME.w / 2, NAME.y + NAME.d / 2 + 1.3], 0.8, P),
};

/* ---------- Feed tray ---------- */

const TRAY_BODY = TRAY;
const GUIDE_BACK: Plan = { x: TRAY.x + 6, y: -25, w: 66, d: 3, r: 0.8 };
const GUIDE_FRONT: Plan = { x: TRAY.x + 6, y: 22, w: 66, d: 3, r: 0.8 };
const FENCE: Plan = { x: FENCE_X + 1.5, y: -22, w: 3, d: 44, r: 0.8 };

export const TRAY_ART = {
  halo: haloOf(TRAY_BODY, 0, BED_Z, P),
  body: box(TRAY_BODY, 0, BED_Z, 4, 0.8),
  seam: sideSeam(TRAY_BODY, 3.5, P, 4),
  well: planOutline(insetPlan(TRAY_BODY, 3), BED_Z, P, 4),
  back: box(GUIDE_BACK, BED_Z, GUIDE_H, 2, 0.4),
  front: box(GUIDE_FRONT, BED_Z, GUIDE_H, 2, 0.4),
  fence: box(FENCE, BED_Z, 6, 2, 0.4),
  guideScrews: on([
    [GUIDE_BACK.x + 6, -23.5, BED_Z + GUIDE_H],
    [GUIDE_BACK.x + GUIDE_BACK.w - 6, -23.5, BED_Z + GUIDE_H],
  ]),
  frontScrews: on([
    [GUIDE_FRONT.x + 6, 23.5, BED_Z + GUIDE_H],
    [GUIDE_FRONT.x + GUIDE_FRONT.w - 6, 23.5, BED_Z + GUIDE_H],
  ]),
  fenceScrews: on([
    [FENCE.x + 1.5, -14, BED_Z + 6],
    [FENCE.x + 1.5, 14, BED_Z + 6],
  ]),
};

/* ---------- Roller bed ---------- */

const cheek = (y: number): Plan => ({ x: CHEEK_X0, y, w: CHEEK_X1 - CHEEK_X0, d: CHEEK_D, r: 1 });
const CHEEK_BACK = cheek(-CHEEK_Y - CHEEK_D);
const CHEEK_FRONT = cheek(CHEEK_Y);
const CAP_Y = CHEEK_Y + CHEEK_D;
export const CAP_R = 2.3;
export const CAP_FACE = CAP_Y + 1.4;

export const ROLLER_ART = {
  backCheek: box(CHEEK_BACK, 0, CHEEK_H, 2, 0.5),
  backScrews: on(ROLLERS.map((x): Point3 => [x, -CHEEK_Y - CHEEK_D / 2, CHEEK_H])),
  rollers: ROLLERS.map((x) => barY(x, ROLLER_Z, ROLLER_R, -CHEEK_Y, CHEEK_Y, P, 32)),
  frontCheek: box(CHEEK_FRONT, 0, CHEEK_H, 2, 0.5),
  frontSeam: sideSeam(CHEEK_FRONT, 2.4, P, 2),
  caps: ROLLERS.map((x) => barY(x, ROLLER_Z, CAP_R, CAP_Y, CAP_FACE, P, 24)),
  capHubs: on(ROLLERS.map((x): Point3 => [x, CAP_FACE, ROLLER_Z])),
  frontScrews: on([
    [CHEEK_X0 + 3, CHEEK_Y + CHEEK_D / 2, CHEEK_H],
    [CHEEK_X1 - 3, CHEEK_Y + CHEEK_D / 2, CHEEK_H],
  ]),
};

/* ---------- Gate ---------- */

const POST_BACK: Plan = { x: POST_X, y: -POST_Y - POST_D, w: POST_W, d: POST_D, r: 1 };
const foot = (post: Plan): Plan => ({
  x: post.x - 3,
  y: post.y - 2,
  w: post.w + 6,
  d: post.d + 4,
  r: 1.6,
});
const ANVIL: Plan = { x: BLADE_X - 1, y: -26, w: BLADE_W + 2, d: 52, r: 0.6 };
const KNEE: Plan = { x: POST_X + 2, y: -POST_Y, w: POST_W - 4, d: 6, r: 0.6 };

/* Aperture scale on the post's +x face: a slot with the blade's index pin riding in it. */
const FACE_X = POST_X + POST_W;
const SLOT_Y0 = -POST_Y - POST_D / 2 - 1.1;
const SLOT_Y1 = -POST_Y - POST_D / 2 + 1.1;
const SLOT_Z0 = GAP_NARROW - 3;
const SLOT_Z1 = GAP_WIDE + 6;
const slotOutline = (() => {
  const r = (SLOT_Y1 - SLOT_Y0) / 2;
  const cy = (SLOT_Y0 + SLOT_Y1) / 2;
  const points: Point3[] = [];
  for (let step = 0; step <= 8; step++) {
    const a = Math.PI + (Math.PI * step) / 8;
    points.push([FACE_X, cy + r * Math.cos(a), SLOT_Z1 - r - r * Math.sin(a)]);
  }
  for (let step = 0; step <= 8; step++) {
    const a = (Math.PI * step) / 8;
    points.push([FACE_X, cy + r * Math.cos(a), SLOT_Z0 + r - r * Math.sin(a)]);
  }
  return pathOf(
    points.map((point) => iso(point, P)),
    true,
  );
})();
const scaleTicks = (() => {
  const minor: string[] = [];
  const major: string[] = [];
  for (let z = SLOT_Z0 + 1, index = 0; z <= SLOT_Z1 - 1; z += 1, index++) {
    const long = index % 5 === 0;
    (long ? major : minor).push(
      pathOf([iso([FACE_X, SLOT_Y1, z], P), iso([FACE_X, SLOT_Y1 + (long ? 2.6 : 1.4), z], P)]),
    );
  }
  return { minor: minor.join(""), major: major.join("") };
})();

export const GATE_ART = {
  bedHalo: haloOf(GATE_BED, 0, BED_Z, P),
  bed: box(GATE_BED, 0, BED_Z, 4, 0.8),
  bedSeam: sideSeam(GATE_BED, 3.5, P, 4),
  anvil: planOutline(ANVIL, BED_Z, P, 2),
  bedScrews: on([
    [GATE_BED.x + 4, -26, BED_Z],
    [GATE_BED.x + 4, 26, BED_Z],
    [GATE_BED.x + GATE_BED.w - 4, -26, BED_Z],
    [GATE_BED.x + GATE_BED.w - 4, 26, BED_Z],
  ]),
  postHalo: haloOf(foot(POST_BACK), 0, POST_H, P),
  foot: box(foot(POST_BACK), 0, 3, 2, 0.4),
  footScrews: on([
    [POST_BACK.x - 1.5, POST_BACK.y + POST_D / 2, 3],
    [POST_BACK.x + POST_W + 1.5, POST_BACK.y + POST_D / 2, 3],
  ]),
  post: box(POST_BACK, 3, POST_H - 3, 2, 0.5),
  postSeam: sideSeam(POST_BACK, 6, P, 2),
  knee: box(KNEE, POST_H - 9, 9, 2, 0.4),
  kneeScrews: on([
    [KNEE.x + 2, KNEE.y + KNEE.d, POST_H - 4.5],
    [KNEE.x + KNEE.w - 2, KNEE.y + KNEE.d, POST_H - 4.5],
  ]),
  slot: slotOutline,
  ticksMinor: scaleTicks.minor,
  ticksMajor: scaleTicks.major,
  bridge: box(BRIDGE, BRIDGE_Z, BRIDGE_H, 3, 0.6),
  bridgeSeam: sideSeam(BRIDGE, BRIDGE_Z + 2, P, 3),
  bridgeScrews: on([
    [18, BRIDGE.y + 3.5, BRIDGE_Z + BRIDGE_H],
    [18, -34, BRIDGE_Z + BRIDGE_H],
  ]),
  bridgeRings: joinPaths([
    ring(18, BRIDGE.y + 3.5, 1.6, BRIDGE_Z + BRIDGE_H, P, 14),
    ring(18, -34, 1.6, BRIDGE_Z + BRIDGE_H, P, 14),
  ]),
};

/* The blade and its guide rods, built at a lower edge of z = 0 and lifted live. */
export const PIN_OFFSET = 4;
const BLADE: Plan = { x: BLADE_X, y: -POST_Y, w: BLADE_W, d: POST_Y + BLADE_Y1, r: 0.4 };
export const BLADE_ART = {
  rods: [-ROD_Y, ROD_Y].map((y) =>
    cylinder(BLADE_X + BLADE_W / 2, y, ROD_R, BLADE_H, ROD_L, P, 16),
  ),
  rodCollars: [-ROD_Y, ROD_Y].map((y) =>
    cylinder(BLADE_X + BLADE_W / 2, y, ROD_R + 1, BLADE_H, 1.6, P, 18),
  ),
  blade: box(BLADE, 0, BLADE_H, 2, 0.4),
  edge: sideSeam(BLADE, 1.2, P, 2),
  ribs: joinPaths(
    [-POST_Y + 12, -2, BLADE_Y1 - 10].map((y) =>
      pathOf([iso([BLADE_X + BLADE_W, y, 0], P), iso([BLADE_X + BLADE_W, y, BLADE_H], P)]),
    ),
  ),
  pin: barX((SLOT_Y0 + SLOT_Y1) / 2, PIN_OFFSET, 0.9, FACE_X - 0.2, FACE_X + 1.6, P, 16),
};

export const SKIRT_R = KNOB_R + 1.3;
export const SKIRT_H = 1.2;

/* Dial on the bridge: a plate with five detents, a knurled knob, the pointer drawn live. */
export const DIAL_ART = {
  plate: cylinder(DIAL[0], DIAL[1], DIAL_PLATE_R, DIAL_Z, DIAL_PLATE_H, P, 48, 0.6),
  plateSeam: sideArc(DIAL[0], DIAL[1], DIAL_PLATE_R, DIAL_Z + 0.8, P, 32),
  bezel: ring(DIAL[0], DIAL[1], DIAL_PLATE_R - 1.4, DIAL_Z + DIAL_PLATE_H, P, 48),
  detents: joinPaths(
    [-2, -1, 0, 1, 2].map((index) => {
      const a = detentAngle(index);
      const inner: [number, number] = [
        DIAL[0] + (SKIRT_R + 0.6) * Math.cos(a),
        DIAL[1] + (SKIRT_R + 0.6) * Math.sin(a),
      ];
      const outer: [number, number] = [
        DIAL[0] + (DIAL_PLATE_R - 1.4) * Math.cos(a),
        DIAL[1] + (DIAL_PLATE_R - 1.4) * Math.sin(a),
      ];
      return lineOnTop(inner, outer, DIAL_Z + DIAL_PLATE_H, P);
    }),
  ),
  skirt: cylinder(DIAL[0], DIAL[1], SKIRT_R, KNOB_Z, SKIRT_H, P, 44, 0.4),
  knob: cylinder(DIAL[0], DIAL[1], KNOB_R, KNOB_Z + SKIRT_H, KNOB_H - SKIRT_H, P, 40, 0.5),
  knurl: knurl(DIAL[0], DIAL[1], KNOB_R, KNOB_Z + SKIRT_H + 0.8, KNOB_Z + KNOB_H - 1.2, 30, P, 0.3),
  knurlSeams: joinPaths([
    sideArc(DIAL[0], DIAL[1], KNOB_R, KNOB_Z + SKIRT_H + 0.8, P, 30),
    sideArc(DIAL[0], DIAL[1], KNOB_R, KNOB_Z + KNOB_H - 1.2, P, 30),
  ]),
  hub: ring(DIAL[0], DIAL[1], 1.4, KNOB_Z + KNOB_H, P, 16),
};

/** Detent `index` (−2..2) fanned around the floor direction that faces the viewer. */
export function detentAngle(index: number) {
  const facing = (55 * Math.PI) / 180;
  return facing + index * DETENT;
}

/* ---------- Out tray ---------- */

const OUT_BACK: Plan = { x: OUT.x, y: OUT.y, w: OUT.w, d: OUT_WALL, r: 0.8 };
const OUT_FRONT: Plan = { x: OUT.x, y: OUT.y + OUT.d - OUT_WALL, w: OUT.w, d: OUT_WALL, r: 0.8 };
const OUT_END: Plan = {
  x: OUT.x + OUT.w - OUT_WALL,
  y: OUT.y + OUT_WALL,
  w: OUT_WALL,
  d: OUT.d - OUT_WALL * 2,
  r: 0,
};
export const OUT_ART = {
  halo: haloOf(OUT, 0, 10, P),
  floor: box(OUT, 0, OUT_FLOOR, 4, 0.5),
  ribs: joinPaths(
    [-16, -8, 0, 8, 16].map((y) =>
      lineOnTop([OUT.x + 8, y], [OUT.x + OUT.w - OUT_WALL - 4, y], OUT_FLOOR, P),
    ),
  ),
  ribEnds: on(
    [-16, -8, 0, 8, 16].flatMap((y): Point3[] => [
      [OUT.x + 8, y, OUT_FLOOR],
      [OUT.x + OUT.w - OUT_WALL - 4, y, OUT_FLOOR],
    ]),
  ),
  back: box(OUT_BACK, OUT_FLOOR, 8, 2, 0.4),
  end: box(OUT_END, OUT_FLOOR, 10, 2, 0.4),
  front: box(OUT_FRONT, OUT_FLOOR, 6, 2, 0.4),
  frontScrews: on([
    [OUT.x + 6, OUT_FRONT.y + OUT_WALL / 2, OUT_FLOOR + 6],
    [OUT.x + OUT.w - 6, OUT_FRONT.y + OUT_WALL / 2, OUT_FLOOR + 6],
  ]),
  backScrews: on([
    [OUT.x + 6, OUT_BACK.y + OUT_WALL / 2, OUT_FLOOR + 8],
    [OUT.x + OUT.w - 6, OUT_BACK.y + OUT_WALL / 2, OUT_FLOOR + 8],
  ]),
};

/* ---------- Reject flag hinge on the bridge ---------- */

const [HINGE_X, HINGE_Y, HINGE_Z] = FLAG_HINGE;
const lug = (x0: number, x1: number): Plan => ({
  x: x0,
  y: HINGE_Y - 1.8,
  w: x1 - x0,
  d: 3.6,
  r: 0.5,
});
const LUG_BACK = lug(HINGE_X - MAST_W / 2 - 2.8, HINGE_X - MAST_W / 2 - 0.3);
const LUG_FRONT = lug(HINGE_X + MAST_W / 2 + 0.3, HINGE_X + MAST_W / 2 + 2.8);
export const FLAG_ART = {
  lugBack: box(LUG_BACK, BRIDGE_TOP, 1.9, 2, 0.3),
  lugFront: box(LUG_FRONT, BRIDGE_TOP, 1.9, 2, 0.3),
  pin: barX(HINGE_Y, HINGE_Z, 0.55, LUG_BACK.x - 0.4, LUG_FRONT.x + LUG_FRONT.w + 0.5, P, 14),
  stop: box(
    {
      x: HINGE_X - MAST_W / 2 - FLAG_WIDTH + 1,
      y: HINGE_Y + MAST_L - 3,
      w: FLAG_WIDTH - 1,
      d: 1.6,
      r: 0.4,
    },
    BRIDGE_TOP,
    0.4,
    2,
    0,
  ),
};

/* ---------- Request counter ---------- */

const COUNTER_FACE = COUNTER.y + COUNTER.d;
export const WINDOW = { x0: COUNTER.x + 3, x1: COUNTER.x + COUNTER.w - 3, z0: 5, z1: 11.5 };
const windowQuad = (dy: number): [Flat, Flat, Flat, Flat] => [
  iso([WINDOW.x0, COUNTER_FACE - dy, WINDOW.z0], P),
  iso([WINDOW.x1, COUNTER_FACE - dy, WINDOW.z0], P),
  iso([WINDOW.x1, COUNTER_FACE - dy, WINDOW.z1], P),
  iso([WINDOW.x0, COUNTER_FACE - dy, WINDOW.z1], P),
];
const RECESS = 1.2;
const front = windowQuad(0);
const back = windowQuad(RECESS);
const cellWidth = (WINDOW.x1 - WINDOW.x0) / 3;
const RESET: [number, number] = [COUNTER.x + COUNTER.w - 5, COUNTER.y + COUNTER.d / 2];
export const COUNTER_ART = {
  halo: haloOf(COUNTER, 0, COUNTER_H, P),
  case: box(COUNTER, 0, COUNTER_H, 3, 0.6),
  seam: sideSeam(COUNTER, 2.6, P, 3),
  lid: sideSeam(COUNTER, COUNTER_H - 2.6, P, 3),
  window: pathOf(front, true),
  windowBack: pathOf(back, true),
  /** Recess walls: the top wall faces up, the left wall faces +x. */
  recessTop: pathOf([front[3], front[2], back[2], back[3]], true),
  recessSide: pathOf([front[0], front[3], back[3], back[0]], true),
  clip: pathOf(back, true),
  dividers: joinPaths(
    [1, 2].map((index) =>
      pathOf([
        iso([WINDOW.x0 + cellWidth * index, COUNTER_FACE - RECESS, WINDOW.z0], P),
        iso([WINDOW.x0 + cellWidth * index, COUNTER_FACE - RECESS, WINDOW.z1], P),
      ]),
    ),
  ),
  /** Face matrix for each digit cell, origin at the cell's top-left. */
  cells: [0, 1, 2].map((index) =>
    sideMatrix(
      [WINDOW.x0 + cellWidth * index + cellWidth / 2, COUNTER_FACE - RECESS],
      WINDOW.z1,
      P,
      "left",
    ),
  ),
  cellHeight: WINDOW.z1 - WINDOW.z0,
  screws: on([
    [COUNTER.x + 2.4, COUNTER_FACE, 2.4 + 1.4],
    [COUNTER.x + COUNTER.w - 2.4, COUNTER_FACE, 2.4 + 1.4],
  ]),
  resetStem: cylinder(RESET[0], RESET[1], 1.6, COUNTER_H, 2.2, P, 16),
  reset: cylinder(RESET[0], RESET[1], 2.8, COUNTER_H + 2.2, 2.4, P, 24, 0.4),
  resetKnurl: knurl(RESET[0], RESET[1], 2.8, COUNTER_H + 2.4, COUNTER_H + 4.4, 16, P, 0.3),
};

/* Feeler: a wheel on an arm that leaves the counter's back face. Built resting on the bed. */
const WHEEL_Z = BED_Z + WHEEL_R;
const ARM: Plan = { x: FEELER_X - 1.4, y: WHEEL_Y1, w: 2.8, d: COUNTER.y - WHEEL_Y1 + 1, r: 0.6 };
export const FEELER_ART = {
  wheel: barY(FEELER_X, WHEEL_Z, WHEEL_R, WHEEL_Y0, WHEEL_Y1, P, 24),
  axle: on([[FEELER_X, WHEEL_Y1, WHEEL_Z]]),
  arm: box(ARM, WHEEL_Z - 0.8, 2.2, 2, 0.3),
};
export const FEELER_WHEEL_Z = WHEEL_Z;
