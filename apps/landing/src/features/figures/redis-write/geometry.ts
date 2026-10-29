import {
  circleRing,
  extrude,
  insetPlan,
  onTop,
  pathOf,
  planOutline,
  sideMatrix,
  sideRing,
  sideSeam,
  slabOf,
  topMatrix,
  cameraOf,
  knurl as kitKnurl,
  type Flat,
  type Plan,
  type Plane,
  type Point3,
  type SolidPaths,
} from "@/components/iso/iso-kit";

import {
  ARRIVE_X,
  BEAD_R,
  BENCH,
  BENCH_H,
  CLIENT,
  CLIENT_FACE,
  CLIENT_TOP,
  CLIENT_Z,
  FOOT_H,
  GATE_PIN_Z,
  GATE_X,
  GLAND_FROM,
  GLAND_TO,
  HINGE_X,
  INSULATORS,
  JAW_X,
  LINE_Z,
  P,
  ROD_R,
  SERVER,
  SERVER_TOP,
  SERVER_Z,
  SWITCH_TOP,
  TRAY_FROM,
  TRAY_TO,
  at,
} from "./view";

const solid = (plan: Plan, z: number, h: number, steps = 6, bevel = 0) =>
  slabOf(plan, z, h, P, steps, bevel);
const cylinder = (cx: number, cy: number, r: number, z: number, h: number, steps = 32) =>
  extrude(circleRing(cx, cy, r, steps), z, h, P, { convex: true });
const ring = (cx: number, cy: number, r: number, z: number, steps = 32) =>
  onTop(circleRing(cx, cy, r, steps), z, P, true);
const segment = (a: Point3, b: Point3) => pathOf([at(a), at(b)]);
const join = (paths: string[]) => paths.join("");
const knurl = (cx: number, cy: number, r: number, z0: number, z1: number, count: number) =>
  kitKnurl(cx, cy, r, z0, z1, count, P);
const polygon = (points: Point3[]) => pathOf(points.map(at), true);

/* ---------- oriented boxes, for the parts that turn (blade, handle, gate) ---------- */

type V = Point3;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V): V => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

const cross = (o: Flat, a: Flat, b: Flat) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

function hull(points: Flat[]): Flat[] {
  const sorted = points.toSorted((a, b) => a[0] - b[0] || a[1] - b[1]);
  const lower: Flat[] = [];
  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= 0
    )
      lower.pop();
    lower.push(point);
  }
  const upper: Flat[] = [];
  for (const point of sorted.toReversed()) {
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, point) <= 0
    )
      upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

const CAM = cameraOf(P);
const VIEW: V = [CAM.cosA * CAM.cosE, CAM.sinA * CAM.cosE, CAM.sinE];
const LIGHT: Plane = [-CAM.sinA, CAM.cosA];

/** A box with half-extent vectors u, v, w about its centre, shaded by facing like the kit's slabs. */
export function boxOf(center: V, u: V, v: V, w: V): SolidPaths {
  const corner = (a: number, b: number, c: number) =>
    add(center, add(scale(u, a), add(scale(v, b), scale(w, c))));
  const faces: { normal: V; points: V[] }[] = [];
  for (const [axis, others] of [
    [u, [v, w]],
    [v, [w, u]],
    [w, [u, v]],
  ] as const) {
    for (const sign of [1, -1]) {
      const [p, q] = others;
      const base = add(center, scale(axis, sign));
      const quad = [
        add(base, add(p, q)),
        add(base, add(p, scale(q, -1))),
        add(base, add(scale(p, -1), scale(q, -1))),
        add(base, add(scale(p, -1), q)),
      ];
      faces.push({ normal: unit(scale(axis, sign)), points: quad });
    }
  }
  const visible = faces.filter((face) => dot(face.normal, VIEW) > 1e-6);
  const shades: string[][] = [[], [], [], []];
  const tops: string[] = [];
  for (const face of visible) {
    const d = polygon(face.points);
    if (face.normal[2] > 0.62) {
      tops.push(d);
      continue;
    }
    const length = Math.hypot(face.normal[0], face.normal[1]) || 1;
    const lit =
      ((face.normal[0] / length) * LIGHT[0] + (face.normal[1] / length) * LIGHT[1] + 1) / 2;
    shades[Math.min(3, Math.max(0, Math.floor(lit * 4)))]!.push(d);
  }
  const creases: string[] = [];
  const keyOf = (a: V, b: V) =>
    [a, b]
      .map((p) => p.map((n) => n.toFixed(3)).join(","))
      .toSorted()
      .join("|");
  const seen = new Map<string, number>();
  for (const face of visible) {
    for (let index = 0; index < 4; index++) {
      const a = face.points[index]!;
      const b = face.points[(index + 1) % 4]!;
      const id = keyOf(a, b);
      seen.set(id, (seen.get(id) ?? 0) + 1);
      if (seen.get(id) === 2) creases.push(segment(a, b));
    }
  }
  const outline = pathOf(
    hull(
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].flatMap(([a, b]) => [at(corner(a!, b!, 1)), at(corner(a!, b!, -1))]),
    ),
    true,
  );
  return {
    fill: outline,
    outline,
    crease: join(creases),
    top: join(tops),
    shades: shades.map(join),
  };
}

/* ---------- things drawn in the plane of a vertical face ---------- */

const fine = (n: number) => Math.round(n * 100) / 100;
export const rectPath = (u0: number, v0: number, u1: number, v1: number, r = 0) => {
  if (!r) return `M${fine(u0)} ${fine(v0)}H${fine(u1)}V${fine(v1)}H${fine(u0)}Z`;
  return `M${fine(u0 + r)} ${fine(v0)}H${fine(u1 - r)}A${r} ${r} 0 0 1 ${fine(u1)} ${fine(v0 + r)}V${fine(v1 - r)}A${r} ${r} 0 0 1 ${fine(u1 - r)} ${fine(v1)}H${fine(u0 + r)}A${r} ${r} 0 0 1 ${fine(u0)} ${fine(v1 - r)}V${fine(v0 + r)}A${r} ${r} 0 0 1 ${fine(u0 + r)} ${fine(v0)}Z`;
};
const circlePath = (cu: number, cv: number, r: number) =>
  `M${fine(cu - r)} ${fine(cv)}A${r} ${r} 0 1 0 ${fine(cu + r)} ${fine(cv)}A${r} ${r} 0 1 0 ${fine(cu - r)} ${fine(cv)}Z`;

/** A rectangular opening in a +y face, with its floor and side wall drawn back to `depth`. */
function recess(face: number, x0: number, x1: number, z0: number, z1: number, depth: number) {
  const back = face - depth;
  return {
    opening: polygon([
      [x0, face, z0],
      [x1, face, z0],
      [x1, face, z1],
      [x0, face, z1],
    ]),
    floor: polygon([
      [x0, face, z0],
      [x1, face, z0],
      [x1, back, z0],
      [x0, back, z0],
    ]),
    wall: polygon([
      [x0, face, z0],
      [x0, face, z1],
      [x0, back, z1],
      [x0, back, z0],
    ]),
    back: polygon([
      [x0, back, z0],
      [x1, back, z0],
      [x1, back, z1],
      [x0, back, z1],
    ]),
    rim: polygon([
      [x0, face, z0],
      [x1, face, z0],
      [x1, face, z1],
      [x0, face, z1],
    ]),
    inner: join([segment([x0, back, z0], [x1, back, z0]), segment([x0, back, z0], [x0, back, z1])]),
    plane: sideMatrix([x0, back], z1, P, "left"),
  };
}

/* ---------- the bench ---------- */

const FEET: Plane[] = [
  [BENCH.x + 22, BENCH.y + 18],
  [BENCH.x + BENCH.w - 22, BENCH.y + 18],
  [BENCH.x + 22, BENCH.y + BENCH.d - 18],
  [BENCH.x + BENCH.w - 22, BENCH.y + BENCH.d - 18],
];
const BENCH_SCREWS: Plane[] = [
  [BENCH.x + 9, BENCH.y + 9],
  [BENCH.x + BENCH.w - 9, BENCH.y + 9],
  [BENCH.x + 9, BENCH.y + BENCH.d - 9],
  [BENCH.x + BENCH.w - 9, BENCH.y + BENCH.d - 9],
];
const LABEL: Plan = { x: -40, y: 33, w: 58, d: 11, r: 1.6 };

export const BENCH_ART = {
  halo: solid(BENCH, -BENCH_H - FOOT_H, BENCH_H).fill,
  feet: FEET.map(([x, y]) => [
    cylinder(x, y, 7, -BENCH_H - FOOT_H, 1.6),
    cylinder(x, y, 5.5, -BENCH_H - FOOT_H + 1.6, FOOT_H - 1.6),
  ]),
  slab: solid(BENCH, -BENCH_H, BENCH_H, 8, 1.6),
  seam: sideSeam(BENCH, -BENCH_H + 3, P, 8),
  groove: planOutline(insetPlan(BENCH, 4.5), 0, P),
  screws: BENCH_SCREWS.map(([x, y]) => at([x, y, 0])),
  screwRings: join(BENCH_SCREWS.map(([x, y]) => ring(x, y, 2.2, 0, 16))),
  label: solid(LABEL, 0, 0.8, 4),
  labelLine: planOutline(insetPlan(LABEL, 1.6), 0.8, P),
  labelScrews: [
    at([LABEL.x + 3.6, LABEL.y + LABEL.d / 2, 0.8]),
    at([LABEL.x + LABEL.w - 3.6, LABEL.y + LABEL.d / 2, 0.8]),
  ],
  labelRule: join(
    [0, 1, 2].map((row) =>
      onTop(
        [
          [LABEL.x + 8, LABEL.y + 3.4 + row * 2.2],
          [LABEL.x + (row === 1 ? 32 : row === 2 ? 40 : 48), LABEL.y + 3.4 + row * 2.2],
        ],
        0.8,
        P,
      ),
    ),
  ),
};

/* ---------- the client ---------- */

const CLIENT_FRONT = CLIENT.y + CLIENT.d;
const KEYS: Plan[] = [];
for (let row = 0; row < 3; row++) {
  for (let column = 0; column < 4; column++) {
    KEYS.push({ x: CLIENT.x + 7 + column * 8, y: CLIENT.y + 30 + row * 6.6, w: 6.4, d: 5.2, r: 1 });
  }
}
const KNOB: Plane = [CLIENT.x + 54, CLIENT.y + 38];
const TOP_VENTS: Plan[] = Array.from({ length: 8 }, (_, index) => ({
  x: CLIENT.x + 8 + index * 7.4,
  y: CLIENT.y + 6,
  w: 2.6,
  d: 13,
  r: 1.3,
}));
const CLIENT_TOP_SCREWS: Point3[] = [
  [CLIENT.x + 4.5, CLIENT.y + 4.5, CLIENT_TOP],
  [CLIENT.x + CLIENT.w - 4.5, CLIENT.y + 4.5, CLIENT_TOP],
  [CLIENT.x + 4.5, CLIENT.y + CLIENT.d - 4.5, CLIENT_TOP],
  [CLIENT.x + CLIENT.w - 4.5, CLIENT.y + CLIENT.d - 4.5, CLIENT_TOP],
];

export const DISPLAY = { x0: CLIENT.x + 6, x1: CLIENT.x + 62, z0: 21, z1: 38 };
const SCREEN = recess(CLIENT_FRONT, DISPLAY.x0, DISPLAY.x1, DISPLAY.z0, DISPLAY.z1, 1.6);

const FRONT_PLANE = sideMatrix([CLIENT.x, CLIENT_FRONT], CLIENT_TOP, P, "left");
const PORT_Y = 0;

export const CLIENT_ART = {
  halo: solid(insetPlan(CLIENT, -3), 0, 0.1).fill,
  plinth: solid(insetPlan(CLIENT, -2), 0, CLIENT_Z, 6, 0.5),
  body: solid(CLIENT, CLIENT_Z, CLIENT_TOP - CLIENT_Z, 6, 1),
  seam: sideSeam(CLIENT, 9, P, 6),
  topScrews: CLIENT_TOP_SCREWS.map(at),
  vents: join(TOP_VENTS.map((plan) => planOutline(plan, CLIENT_TOP, P, 4))),
  keys: KEYS.map((plan) => solid(plan, CLIENT_TOP, 1.4, 3, 0.4)),
  keypadWell: planOutline(
    { x: CLIENT.x + 5, y: CLIENT.y + 28, w: 35.6, d: 22, r: 2 },
    CLIENT_TOP,
    P,
    4,
  ),
  knobCollar: cylinder(KNOB[0], KNOB[1], 6.6, CLIENT_TOP, 1.2, 36),
  knob: cylinder(KNOB[0], KNOB[1], 5.2, CLIENT_TOP + 1.2, 4.2, 36),
  knobKnurl: knurl(KNOB[0], KNOB[1], 5.2, CLIENT_TOP + 1.2, CLIENT_TOP + 5.4, 34),
  knobFace: ring(KNOB[0], KNOB[1], 3.6, CLIENT_TOP + 5.4, 28),
  knobPointer: onTop(
    [
      [KNOB[0], KNOB[1] + 0.6],
      [KNOB[0], KNOB[1] + 3.6],
    ],
    CLIENT_TOP + 5.4,
    P,
  ),
  knobTicks: join(
    [-2, -1, 0, 1, 2].map((index) => {
      const angle = Math.PI / 2 + index * 0.5;
      return onTop(
        [
          [KNOB[0] + Math.cos(angle) * 7.6, KNOB[1] + Math.sin(angle) * 7.6],
          [
            KNOB[0] + Math.cos(angle) * (index === 0 ? 9.8 : 9),
            KNOB[1] + Math.sin(angle) * (index === 0 ? 9.8 : 9),
          ],
        ],
        CLIENT_TOP,
        P,
      );
    }),
  ),
  screen: SCREEN,
  frontPlane: FRONT_PLANE,
  /** Front face, in face coordinates: u along +x from the left edge, v down from the top. */
  bezel: rectPath(4.4, CLIENT_TOP - DISPLAY.z1 - 1.6, 63.6, CLIENT_TOP - DISPLAY.z0 + 1.6, 1.4),
  leds: [
    [11, 30],
    [17.5, 30],
  ] as Flat[],
  ledRings: join([circlePath(11, 30, 1.7), circlePath(17.5, 30, 1.7)]),
  frontVents: join(
    Array.from({ length: 7 }, (_, index) =>
      rectPath(33 + index * 4.6, 26.5, 35 + index * 4.6, 33, 1),
    ),
  ),
  frontScrews: [
    [3.4, 3.4],
    [CLIENT.w - 3.4, 3.4],
    [3.4, CLIENT_TOP - CLIENT_Z - 3.4],
    [CLIENT.w - 3.4, CLIENT_TOP - CLIENT_Z - 3.4],
  ] as Flat[],
  port: join([
    sideRing([CLIENT_FACE, PORT_Y, LINE_Z - 0.6], 7.2, "x", P, 36),
    sideRing([CLIENT_FACE, PORT_Y, LINE_Z - 0.6], 8.4, "x", P, 36),
  ]),
  portScrews: [
    [CLIENT_FACE, PORT_Y - 11, LINE_Z + 7],
    [CLIENT_FACE, PORT_Y + 11, LINE_Z + 7],
    [CLIENT_FACE, PORT_Y - 11, LINE_Z - 8],
    [CLIENT_FACE, PORT_Y + 11, LINE_Z - 8],
  ].map((point) => at(point as Point3)),
  sideVents: join(
    Array.from({ length: 6 }, (_, index) => {
      const y = -15 + index * 6;
      return polygon([
        [CLIENT_FACE, y - 1.2, 8],
        [CLIENT_FACE, y + 1.2, 8],
        [CLIENT_FACE, y + 1.2, 15],
        [CLIENT_FACE, y - 1.2, 15],
      ]);
    }),
  ),
};

/* ---------- the send tray and its gate ---------- */

const TRAY_Y = 4.6;
const FLOOR_TOP = LINE_Z - BEAD_R;
const WALL_TOP = LINE_Z + 1.8;
const LIP_TOP = LINE_Z - 1.2;
const POST: Plan = { x: GATE_X - 0.9, y: 0, w: 3, d: 1.6, r: 0.4 };

export const TRAY_ART = {
  web: solid({ x: TRAY_FROM, y: -1.2, w: 9, d: 2.4, r: 0.4 }, 14, FLOOR_TOP - 1.6 - 14, 3),
  floor: solid(
    { x: TRAY_FROM, y: -TRAY_Y, w: TRAY_TO - TRAY_FROM, d: TRAY_Y * 2, r: 0.6 },
    FLOOR_TOP - 1.6,
    1.6,
    3,
    0.3,
  ),
  floorLine: onTop(
    [
      [TRAY_FROM, 0],
      [TRAY_TO, 0],
    ],
    FLOOR_TOP,
    P,
  ),
  backWall: solid(
    { x: TRAY_FROM, y: -TRAY_Y, w: TRAY_TO - TRAY_FROM, d: 1.2, r: 0.3 },
    FLOOR_TOP,
    WALL_TOP - FLOOR_TOP,
    3,
  ),
  frontWall: solid(
    { x: TRAY_FROM, y: TRAY_Y - 1.2, w: TRAY_TO - TRAY_FROM, d: 1.2, r: 0.3 },
    FLOOR_TOP,
    LIP_TOP - FLOOR_TOP,
    3,
  ),
  frontRivets: [TRAY_FROM + 4, TRAY_FROM + 9].map((x) => at([x, TRAY_Y, FLOOR_TOP + 0.9])),
  backPost: solid({ ...POST, y: -TRAY_Y }, WALL_TOP, GATE_PIN_Z + 1.6 - WALL_TOP, 3),
  frontPost: solid({ ...POST, y: TRAY_Y - 1.6 }, LIP_TOP, GATE_PIN_Z + 1.6 - LIP_TOP, 3),
  bridge: solid(
    { x: POST.x - 0.2, y: -TRAY_Y - 0.2, w: POST.w + 0.4, d: TRAY_Y * 2 + 0.4, r: 0.6 },
    GATE_PIN_Z + 1.6,
    1.4,
    3,
    0.3,
  ),
  bridgeScrews: [
    at([GATE_X + 0.6, -TRAY_Y + 0.8, GATE_PIN_Z + 3]),
    at([GATE_X + 0.6, TRAY_Y - 0.8, GATE_PIN_Z + 3]),
  ],
  pin: sideRing([GATE_X, TRAY_Y, GATE_PIN_Z], 0.75, "y", P, 14),
  pinDot: at([GATE_X, TRAY_Y, GATE_PIN_Z]),
};

/** The gate hangs from its pin across the tray; open, it swings out and up along +x. */
export function gateOf(open: number) {
  const swing = open * 1.6;
  const down: V = [Math.sin(swing), 0, -Math.cos(swing)];
  const across: V = [Math.cos(swing), 0, Math.sin(swing)];
  const length = GATE_PIN_Z - FLOOR_TOP - 0.6;
  const center = add([GATE_X, 0, GATE_PIN_Z], scale(down, length / 2 + 0.4));
  return boxOf(center, scale(down, length / 2), [0, TRAY_Y - 1.75, 0], scale(across, 0.5));
}

/* ---------- the line: two conductors on insulators ---------- */

/** The command runs on the front conductor (y = 0); the return conductor runs behind it. */
export const RETURN_Y = -14;
const ROD_PLAN = (x0: number, x1: number, cy: number): Plan => ({
  x: x0,
  y: cy - ROD_R,
  w: x1 - x0,
  d: ROD_R * 2,
  r: ROD_R - 0.05,
});
export const LUG_A = { x0: -48, x1: -40 };
export const LUG_B = { x0: 40, x1: 48 };
const RETURN_POST = CLIENT_FACE + 4;
const rod = (x0: number, x1: number, cy: number) =>
  solid(ROD_PLAN(x0, x1, cy), LINE_Z - ROD_R, ROD_R * 2, 3);

export const RODS = {
  a: rod(TRAY_TO, LUG_A.x0, 0),
  b: rod(LUG_B.x1, GLAND_FROM, 0),
  a2: rod(RETURN_POST, LUG_A.x0, RETURN_Y),
  b2: rod(LUG_B.x1, GLAND_FROM, RETURN_Y),
};

const CAP_TOP = LINE_Z - ROD_R;
function insulator(cx: number, cy: number) {
  const parts: SolidPaths[] = [cylinder(cx, cy, 6.2, 0, 1.4, 36)];
  const sheds = [7, 13, 19];
  let z = 1.4;
  for (const shed of sheds) {
    parts.push(cylinder(cx, cy, 2.6, z, shed - z, 24));
    parts.push(cylinder(cx, cy, 5.6, shed, 1.2, 36));
    z = shed + 1.2;
  }
  parts.push(cylinder(cx, cy, 2.6, z, CAP_TOP - 3.2 - z, 24));
  parts.push(cylinder(cx, cy, 3.5, CAP_TOP - 3.2, 3.2, 28));
  return {
    parts,
    bolts: [0, 1, 2].map((index) => {
      const angle = 0.5 + index * ((Math.PI * 2) / 3);
      return at([cx + Math.cos(angle) * 4.8, cy + Math.sin(angle) * 4.8, 1.4]);
    }),
    shedLines: join(sheds.map((shed) => ring(cx, cy, 4.1, shed + 1.2, 28))),
    backCheek: solid(
      { x: cx - 1.8, y: cy - ROD_R - 1.3, w: 3.6, d: 1.2, r: 0.3 },
      CAP_TOP,
      ROD_R + 1.1,
      2,
    ),
    frontCheek: solid(
      { x: cx - 1.8, y: cy + ROD_R + 0.1, w: 3.6, d: 1.2, r: 0.3 },
      CAP_TOP,
      ROD_R + 1.1,
      2,
    ),
    capSeam: ring(cx, cy, 2.3, CAP_TOP, 20),
  };
}

export const INSULATOR_ART = {
  a: insulator(INSULATORS[0]!, 0),
  b: insulator(INSULATORS[1]!, 0),
  a2: insulator(INSULATORS[0]!, RETURN_Y),
  b2: insulator(INSULATORS[1]!, RETURN_Y),
};

/** Where the return conductor leaves the client: a terminal block on its +x face. */
const RETURN_BLOCK: Plan = {
  x: CLIENT_FACE,
  y: RETURN_Y - 4.4,
  w: RETURN_POST - CLIENT_FACE,
  d: 8.8,
  r: 0.8,
};
export const RETURN_ART = {
  block: solid(RETURN_BLOCK, LINE_Z - 4.4, 8.8, 3, 0.4),
  nut: sideRing([RETURN_POST, RETURN_Y, LINE_Z], 2.6, "x", P, 18),
  screws: [
    at([RETURN_POST, RETURN_Y - 3, LINE_Z + 3]),
    at([RETURN_POST, RETURN_Y + 3, LINE_Z - 3]),
  ],
};

/* ---------- the knife switch: two poles, one crossbar ---------- */

const MID_Y = RETURN_Y / 2;
const RISER: Plan = { x: -58, y: RETURN_Y - 13, w: 116, d: 40, r: 2 };
const SLATE: Plan = { x: -54, y: RETURN_Y - 9, w: 108, d: 32, r: 1.6 };
const RISER_TOP = SWITCH_TOP - 5;
const CHEEK_TOP = LINE_Z + 4.2;
const CHEEK_GAP = 1.2;
const CHEEK_T = 1.5;
const FOOT_TOP = SWITCH_TOP + 1.4;

function clip(cx: number, cy: number) {
  return {
    foot: solid({ x: cx - 4.4, y: cy - 5, w: 8.8, d: 10, r: 0.8 }, SWITCH_TOP, 1.4, 3, 0.3),
    back: solid(
      { x: cx - 3, y: cy - CHEEK_GAP - CHEEK_T, w: 6, d: CHEEK_T, r: 0.3 },
      FOOT_TOP,
      CHEEK_TOP - FOOT_TOP,
      3,
    ),
    front: solid(
      { x: cx - 3, y: cy + CHEEK_GAP, w: 6, d: CHEEK_T, r: 0.3 },
      FOOT_TOP,
      CHEEK_TOP - FOOT_TOP,
      3,
    ),
    footScrews: [at([cx - 2.8, cy - 3.4, FOOT_TOP]), at([cx + 2.8, cy + 3.4, FOOT_TOP])],
  };
}

function lug(x0: number, x1: number, cy: number) {
  const cx = (x0 + x1) / 2;
  const top = LINE_Z + 2.4;
  const plan: Plan = { x: x0, y: cy - 3.6, w: x1 - x0, d: 7.2, r: 0.8 };
  return {
    body: solid(plan, SWITCH_TOP, top - SWITCH_TOP, 3, 0.4),
    seam: sideSeam(plan, SWITCH_TOP + 4, P, 3),
    head: cylinder(cx, cy, 2.3, top, 1.2, 24),
    slot: onTop(
      [
        [cx - 1.5, cy - 1],
        [cx + 1.5, cy + 1],
      ],
      top + 1.2,
      P,
    ),
  };
}

function pole(cy: number) {
  return {
    jaw: clip(JAW_X, cy),
    hinge: clip(HINGE_X, cy),
    strapA: solid(
      { x: LUG_A.x1, y: cy - 2.2, w: JAW_X - 4.4 - LUG_A.x1, d: 4.4, r: 0.3 },
      SWITCH_TOP,
      0.9,
      2,
    ),
    strapB: solid(
      { x: HINGE_X + 4.4, y: cy - 2.2, w: LUG_B.x0 - HINGE_X - 4.4, d: 4.4, r: 0.3 },
      SWITCH_TOP,
      0.9,
      2,
    ),
    lugA: lug(LUG_A.x0, LUG_A.x1, cy),
    lugB: lug(LUG_B.x0, LUG_B.x1, cy),
    jawRivet: at([JAW_X, cy + CHEEK_GAP + CHEEK_T, LINE_Z - 1.6]),
    pin: sideRing([HINGE_X, cy + CHEEK_GAP + CHEEK_T, LINE_Z], 1.5, "y", P, 18),
    pinDot: at([HINGE_X, cy + CHEEK_GAP + CHEEK_T, LINE_Z]),
  };
}

const SLATE_SCREWS: Plane[] = [
  [SLATE.x + 5, SLATE.y + 5],
  [SLATE.x + SLATE.w - 5, SLATE.y + 5],
  [SLATE.x + 5, SLATE.y + SLATE.d - 5],
  [SLATE.x + SLATE.w - 5, SLATE.y + SLATE.d - 5],
];
/** A raised insulating barrier between the poles, as on a real double-pole switch. */
const BARRIER: Plan = { x: -10, y: MID_Y - 0.9, w: 20, d: 1.8, r: 0.6 };

export const SWITCH_ART = {
  riserHalo: solid(insetPlan(RISER, -2), 0, 0.1).fill,
  riser: solid(RISER, 0, RISER_TOP, 6, 0.8),
  riserSeam: sideSeam(RISER, 3, P, 6),
  riserScrews: [
    [RISER.x + 2.4, RISER.y + 2.4],
    [RISER.x + RISER.w - 2.4, RISER.y + 2.4],
    [RISER.x + 2.4, RISER.y + RISER.d - 2.4],
    [RISER.x + RISER.w - 2.4, RISER.y + RISER.d - 2.4],
  ].map(([x, y]) => at([x!, y!, RISER_TOP])),
  slate: solid(SLATE, RISER_TOP, SWITCH_TOP - RISER_TOP, 6, 0.8),
  slateLine: planOutline(insetPlan(SLATE, 2.2), SWITCH_TOP, P),
  slateScrews: SLATE_SCREWS.map(([x, y]) => at([x, y, SWITCH_TOP])),
  slateScrewRings: join(SLATE_SCREWS.map(([x, y]) => ring(x, y, 1.8, SWITCH_TOP, 14))),
  barrier: solid(BARRIER, SWITCH_TOP, 7, 3, 0.3),
  front: pole(0),
  back: pole(RETURN_Y),
};

const BLADE_FROM = -3;
const BLADE_TO = HINGE_X - (JAW_X - 11);
const BLADE_HALF_H = 3.1;
const HANDLE_AT = BLADE_TO - 2.4;

/** Both blades, the crossbar that ties them, and the grip, turned about the hinge pins. */
export function bladeOf(angle: number) {
  const along: V = [-Math.cos(angle), 0, Math.sin(angle)];
  const up: V = [Math.sin(angle), 0, Math.cos(angle)];
  const middle = (BLADE_FROM + BLADE_TO) / 2;
  const bladeAt = (cy: number) =>
    boxOf(
      add([HINGE_X, cy, LINE_Z], scale(along, middle)),
      scale(along, (BLADE_TO - BLADE_FROM) / 2),
      [0, 1, 0],
      scale(up, BLADE_HALF_H),
    );
  const pin: V = [HINGE_X, MID_Y, LINE_Z];
  const barBase = add(pin, add(scale(along, HANDLE_AT), scale(up, BLADE_HALF_H)));
  const crossbar = boxOf(
    add(barBase, scale(up, 1.4)),
    scale(along, 1.8),
    [0, -RETURN_Y / 2 + 2.6, 0],
    scale(up, 1.4),
  );
  const stemBase = add(barBase, scale(up, 2.8));
  const stem = boxOf(add(stemBase, scale(up, 2.2)), scale(along, 1.3), [0, 1.3, 0], scale(up, 2.2));
  const ferrule = boxOf(
    add(stemBase, scale(up, 5.1)),
    scale(along, 2.4),
    [0, 2.4, 0],
    scale(up, 0.7),
  );
  const grip = boxOf(
    add(stemBase, scale(up, 12.3)),
    scale(along, 2.8),
    [0, 2.8, 0],
    scale(up, 6.5),
  );
  const barScrews = [0, RETURN_Y].map((cy) =>
    at(add(add([HINGE_X, cy, LINE_Z], scale(along, HANDLE_AT)), scale(up, BLADE_HALF_H + 2.8))),
  );
  return { blade: bladeAt(0), blade2: bladeAt(RETURN_Y), crossbar, stem, ferrule, grip, barScrews };
}

/* ---------- the server ---------- */

const SERVER_FRONT = SERVER.y + SERVER.d;
const SERVER_RIGHT = SERVER.x + SERVER.w;
const SERVER_TOP_SCREWS: Point3[] = [
  [SERVER.x + 4.5, SERVER.y + 4.5, SERVER_TOP],
  [SERVER_RIGHT - 4.5, SERVER.y + 4.5, SERVER_TOP],
  [SERVER.x + 4.5, SERVER_FRONT - 4.5, SERVER_TOP],
  [SERVER_RIGHT - 4.5, SERVER_FRONT - 4.5, SERVER_TOP],
];
const SERVER_VENTS: Plan[] = Array.from({ length: 10 }, (_, index) => ({
  x: SERVER.x + 10 + index * 6.6,
  y: SERVER.y + 7,
  w: 2.6,
  d: 16,
  r: 1.3,
}));
const NAMEPLATE: Plan = { x: SERVER.x + 10, y: SERVER_FRONT - 17, w: 22, d: 9, r: 1.2 };

export const COUNTER = {
  x0: SERVER.x + 44,
  x1: SERVER.x + 75,
  z0: SERVER_TOP - 17,
  z1: SERVER_TOP - 4.5,
  wheels: 4,
};
const COUNTER_RECESS = recess(SERVER_FRONT, COUNTER.x0, COUNTER.x1, COUNTER.z0, COUNTER.z1, 1.8);
export const WHEEL_W = (COUNTER.x1 - COUNTER.x0) / COUNTER.wheels;
export const WHEEL_PITCH = 11;

const BAYS: { u: number; v: number; w: number; h: number }[] = [];
for (let row = 0; row < 3; row++) {
  for (let column = 0; column < 2; column++) {
    BAYS.push({ u: 5 + column * 37, v: 22 + row * 12.4, w: 35, h: 11.2 });
  }
}

export const SERVER_ART = {
  halo: solid(insetPlan(SERVER, -3), 0, 0.1).fill,
  plinth: solid(insetPlan(SERVER, -2), 0, SERVER_Z, 6, 0.5),
  body: solid(SERVER, SERVER_Z, SERVER_TOP - SERVER_Z, 6, 1),
  seam: sideSeam(SERVER, 5, P, 6),
  topScrews: SERVER_TOP_SCREWS.map(at),
  vents: join(SERVER_VENTS.map((plan) => planOutline(plan, SERVER_TOP, P, 4))),
  nameplate: solid(NAMEPLATE, SERVER_TOP, 0.7, 3),
  nameplateLine: planOutline(insetPlan(NAMEPLATE, 1.2), SERVER_TOP + 0.7, P, 3),
  nameplateScrews: [
    at([NAMEPLATE.x + 2.4, NAMEPLATE.y + NAMEPLATE.d / 2, SERVER_TOP + 0.7]),
    at([NAMEPLATE.x + NAMEPLATE.w - 2.4, NAMEPLATE.y + NAMEPLATE.d / 2, SERVER_TOP + 0.7]),
  ],
  nameplateText: topMatrix(
    [NAMEPLATE.x + NAMEPLATE.w / 2, NAMEPLATE.y + NAMEPLATE.d / 2 + 1.2],
    SERVER_TOP + 0.7,
    P,
    "x",
  ),
  frontPlane: sideMatrix([SERVER.x, SERVER_FRONT], SERVER_TOP, P, "left"),
  counter: COUNTER_RECESS,
  counterBezel: rectPath(
    COUNTER.x0 - SERVER.x - 1.6,
    4.5 - 1.6,
    COUNTER.x1 - SERVER.x + 1.6,
    17 + 1.6,
    1.2,
  ),
  counterKnob: { u: COUNTER.x0 - SERVER.x - 6.5, v: 10.75 },
  leds: [
    [7, 10.75],
    [13.5, 10.75],
    [20, 10.75],
  ] as Flat[],
  ledRings: join([
    circlePath(7, 10.75, 1.7),
    circlePath(13.5, 10.75, 1.7),
    circlePath(20, 10.75, 1.7),
  ]),
  bays: join(BAYS.map((bay) => rectPath(bay.u, bay.v, bay.u + bay.w, bay.v + bay.h, 1))),
  bayHandles: join(
    BAYS.map((bay) => rectPath(bay.u + 3, bay.v + 3.4, bay.u + 17, bay.v + 7.8, 1.6)),
  ),
  bayLeds: BAYS.map((bay) => [bay.u + bay.w - 4, bay.v + 5.6] as Flat),
  bayVents: join(
    BAYS.map((bay) =>
      [0, 1, 2]
        .map((index) =>
          rectPath(bay.u + 20 + index * 3, bay.v + 3.2, bay.u + 21.4 + index * 3, bay.v + 8, 0.6),
        )
        .join(""),
    ),
  ),
  frontScrews: [
    [3.2, 3.2],
    [SERVER.w - 3.2, 3.2],
  ] as Flat[],
  sidePlane: sideMatrix([SERVER_RIGHT, SERVER_FRONT], SERVER_TOP, P, "right"),
  fan: join([13, 10, 7, 4].map((r) => circlePath(22, 26, r))),
  fanFrame: rectPath(6, 10, 38, 42, 2.4),
  fanScrews: [
    [9, 13],
    [35, 13],
    [9, 39],
    [35, 39],
  ] as Flat[],
  fanSpokes: join(
    [0, 1, 2, 3].map((index) => {
      const angle = Math.PI / 4 + (index * Math.PI) / 2;
      return `M${fine(22 + Math.cos(angle) * 4)} ${fine(26 + Math.sin(angle) * 4)}L${fine(22 + Math.cos(angle) * 13)} ${fine(26 + Math.sin(angle) * 13)}`;
    }),
  ),
  inlet: rectPath(44, 34, 58, 46, 1.4),
  inletPins: join([
    rectPath(47.2, 38, 48.4, 41.4, 0.3),
    rectPath(53.6, 38, 54.8, 41.4, 0.3),
    rectPath(50.4, 42.4, 51.6, 44.4, 0.3),
  ]),
  sideVents: join(
    Array.from({ length: 5 }, (_, index) =>
      rectPath(44 + index * 3, 12, 45.6 + index * 3, 28, 0.8),
    ),
  ),
  glands: [RETURN_Y, 0].map((cy) => ({
    body: solid(
      { x: GLAND_FROM + 3.2, y: cy - 4.6, w: GLAND_TO - GLAND_FROM - 3.2, d: 9.2, r: 1.6 },
      LINE_Z - 4.6,
      9.2,
      4,
    ),
    nut: solid({ x: GLAND_FROM, y: cy - 5.6, w: 3.6, d: 11.2, r: 1 }, LINE_Z - 5.6, 11.2, 3, 0.4),
    face: sideRing([GLAND_FROM, cy, LINE_Z], 2.6, "x", P, 18),
  })),
};

/* ---------- beads ---------- */

export const BEAD_SCREEN_R = Math.round(BEAD_R * cameraOf(P).k * 100) / 100;
export const ARRIVE = at([ARRIVE_X, 0, LINE_Z]);
