import { iso, type Flat, type Plan, type Point3, type Projection } from "@/components/iso/iso-kit";

export const WIDTH = 600;
export const HEIGHT = 318;
const PAD = 26;
export const AZIMUTH = 58;

/** The bench everything stands on. World units are about 1 px; z is up from the bench top. */
export const BENCH: Plan = { x: -192, y: -50, w: 384, d: 100, r: 8 };
export const BENCH_H = 9;
export const FOOT_H = 5;

/** The line: one conductor at this height from the client's send tray to the server's gland. */
export const LINE_Z = 30;
export const ROD_R = 1.5;
export const BEAD_R = 3.5;

export const CLIENT: Plan = { x: -178, y: -26, w: 68, d: 52, r: 3 };
export const CLIENT_Z = 2;
export const CLIENT_TOP = 44;
export const CLIENT_FACE = CLIENT.x + CLIENT.w;

export const TRAY_FROM = CLIENT_FACE;
export const TRAY_TO = TRAY_FROM + 18;
export const GATE_X = TRAY_TO - 2.6;
export const GATE_PIN_Z = 35.2;
export const QUEUED_X = GATE_X - 0.5 - BEAD_R;
export const SPAWN_X = CLIENT_FACE + 1.2;

export const JAW_X = -24;
export const HINGE_X = 24;
export const LUG_W = 7;
export const BLADE_LONG = HINGE_X - JAW_X + 3;
export const OPEN_ANGLE = 0.95;
export const SWITCH_TOP = 18;

export const INSULATORS = [-72, 66];

export const SERVER: Plan = { x: 104, y: -32, w: 80, d: 64, r: 3 };
export const SERVER_Z = 2;
export const SERVER_TOP = 64;
export const GLAND_FROM = 82;
export const GLAND_TO = SERVER.x;
export const ARRIVE_X = 90;

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
  ...corners(BENCH, -BENCH_H - FOOT_H, 0),
  ...corners(SERVER, 0, SERVER_TOP),
  ...corners(CLIENT, 0, CLIENT_TOP + 4),
  [0, 0, 80],
]);

export const at = (point: Point3): Flat => iso(point, P);
