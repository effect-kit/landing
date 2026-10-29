import { iso, type Flat, type Plan, type Point3, type Projection } from "@/components/iso/iso-kit";

export const WIDTH = 600;
export const HEIGHT = 300;
const PAD = 22;
export const AZIMUTH = 55;

/* Bench */
export const PLATE: Plan = { x: -152, y: -60, w: 304, d: 120, r: 8 };
export const PLATE_H = 9;
export const FOOT_H = 5;

/* Everything the letter rides on has its top at BED_Z. */
export const BED_Z = 10;

/* Feed tray, where a letter is loaded. */
export const TRAY: Plan = { x: -146, y: -28, w: 80, d: 56, r: 2 };
export const GUIDE_H = 4;
export const FENCE_X = -146;

/* Roller bed between two cheek plates. */
export const CHEEK_X0 = -66;
export const CHEEK_X1 = 10;
export const CHEEK_Y = 30;
export const CHEEK_D = 4;
export const CHEEK_H = 9;
export const ROLLER_R = 3.2;
export const ROLLER_Z = BED_Z - ROLLER_R;
export const ROLLERS = [-56, -38, -20, -2];

/* Gate: a C-frame (one post at the back, a bridge reaching over the bed) and a blade whose lower edge sets the aperture. */
export const GATE_BED: Plan = { x: 8, y: -30, w: 50, d: 60, r: 2 };
export const POST_X = 16;
export const POST_W = 14;
export const POST_Y = 34;
export const POST_D = 12;
export const POST_H = 56;
export const BRIDGE: Plan = {
  x: 13,
  y: -POST_Y - POST_D - 2,
  w: 20,
  d: POST_Y * 2 + POST_D + 2,
  r: 2,
};
export const BLADE_Y1 = 30;
export const BRIDGE_Z = POST_H;
export const BRIDGE_H = 6;
export const BRIDGE_TOP = BRIDGE_Z + BRIDGE_H;
export const BLADE_X = 21;
export const BLADE_W = 4;
export const BLADE_H = 20;
/** Aperture: lower edge of the blade, measured as a world z. */
export const GAP_WIDE = BED_Z + 7.6;
export const GAP_NARROW = BED_Z + 2.8;
export const ROD_Y = 18;
export const ROD_R = 1.3;
export const ROD_L = 24;

/* Dial on the bridge. */
export const DIAL: Flat = [23, 0];
export const DIAL_PLATE_R = 10;
export const DIAL_PLATE_H = 2;
export const KNOB_R = 5.6;
export const KNOB_H = 6;
export const DIAL_Z = BRIDGE_TOP;
export const KNOB_Z = DIAL_Z + DIAL_PLATE_H;
export const KNOB_TOP = KNOB_Z + KNOB_H;
/** Detent spacing on the dial, fanned around the direction that faces the viewer. */
export const DETENT = (30 * Math.PI) / 180;

/* Out tray, past the end of the gate bed. */
export const OUT: Plan = { x: 58, y: -32, w: 82, d: 64, r: 2 };
export const OUT_FLOOR = 2;
export const OUT_WALL = 3;

/* Reject flag: hinged along x at the back of the bridge; it lies flat when stowed and stands up to reject. */
export const FLAG_HINGE: Point3 = [29, -40, BRIDGE_TOP + 0.6];
export const MAST_L = 20;
export const MAST_W = 1.6;
export const FLAG_FROM = 10;
export const FLAG_WIDTH = 9;
export const FLAG_T = 0.8;

/* Request counter with a feeler wheel that rides on whatever passes under it. */
export const COUNTER: Plan = { x: 36, y: 40, w: 22, d: 12, r: 1.5 };
export const COUNTER_H = 16;
export const FEELER_X = 47;
export const WHEEL_R = 2.4;
export const WHEEL_Y0 = 11;
export const WHEEL_Y1 = 14;

/* The letter. */
export const LETTER_W = 64;
export const LETTER_D = 40;
export const THIN = 1.8;
export const THICK = 6;
export const LOAD_X = TRAY.x + 6 + LETTER_W / 2 + 6;
export const BLADE_BACK = BLADE_X;
/** Leading edge stops a hair short of the blade, then the rollers back it off. */
export const STOP_X = BLADE_BACK - 0.4 - LETTER_W / 2;
export const BACK_X = STOP_X - 7;
export const DROP_X = GATE_BED.x + GATE_BED.w + LETTER_W / 2;
export const OUT_X = 100;

function fit(points: Point3[]): Projection {
  const unit: Projection = { origin: [0, 0], scale: 1, azimuth: AZIMUTH };
  const flat = points.map((point) => iso(point, unit));
  const xs = flat.map(([x]) => x);
  const ys = flat.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const up = Math.min(...ys);
  const down = Math.max(...ys);
  const scale = Math.min((WIDTH - PAD * 2) / (right - left), (HEIGHT - PAD * 2) / (down - up));
  return {
    origin: [WIDTH / 2 - ((left + right) / 2) * scale, HEIGHT / 2 - ((up + down) / 2) * scale],
    scale,
    azimuth: AZIMUTH,
  };
}

const corners = ({ x, y, w, d }: Plan, z0: number, z1: number): Point3[] => {
  const out: Point3[] = [];
  for (const px of [x, x + w])
    for (const py of [y, y + d]) for (const z of [z0, z1]) out.push([px, py, z]);
  return out;
};

export const P = fit([
  ...corners(PLATE, -PLATE_H - FOOT_H, 0),
  ...corners(BRIDGE, BRIDGE_Z, KNOB_TOP + 4),
  [FLAG_HINGE[0], FLAG_HINGE[1], FLAG_HINGE[2] + MAST_L + 1],
  [FLAG_HINGE[0] - MAST_W - FLAG_WIDTH, FLAG_HINGE[1], FLAG_HINGE[2] + MAST_L + 1],
]);

export const at = (point: Point3) => iso(point, P);
