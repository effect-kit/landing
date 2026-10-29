import {
  boxCorners,
  fitProjection,
  iso,
  type Flat,
  type Plan,
  type Point3,
} from "@/components/iso/iso-kit";

import { angleOf, type Selector } from "./model";

export const WIDTH = 600;
export const HEIGHT = 330;
export const AZIMUTH = 58;
export const ELEVATION = 34;

/** The case: a flat skiff, rails along x at the back and front, cheeks at both ends. */
export const INNER = 100;
export const DEPTH = 45;
export const CHEEK = 8;
export const TUB_Z = -14;
export const CHEEK_Z0 = -16;
export const CHEEK_TOP = 6;
export const FOOT_H = 3;

export const RAIL_W = 8;
export const RAIL_TOP = 3;
export const PANEL_Y = 42;
export const PANEL_Z = RAIL_TOP;
export const PANEL_H = 1.6;
export const PANEL_TOP = PANEL_Z + PANEL_H;
export const GAP = 0.6;

export interface Module {
  key: "program" | Selector | "blank";
  x0: number;
  x1: number;
}

const WIDTHS: [Module["key"], number][] = [
  ["redis", 50],
  ["program", 52],
  ["emails", 54],
  ["blank", 0],
];

export const MODULES: Module[] = (() => {
  const list: Module[] = [];
  let x = -INNER;
  for (const [key, width] of WIDTHS) {
    const x1 = width ? x + width : INNER;
    list.push({ key, x0: x, x1 });
    x = x1 + GAP;
  }
  return list;
})();

export const moduleOf = (key: Module["key"]) => {
  const found = MODULES.find((module) => module.key === key);
  if (!found) throw new Error(`No module ${key}`);
  return found;
};
export const centreOf = (key: Module["key"]) => {
  const { x0, x1 } = moduleOf(key);
  return (x0 + x1) / 2;
};

export const panelPlan = ({ x0, x1 }: Module): Plan => ({
  x: x0,
  y: -PANEL_Y,
  w: x1 - x0,
  d: PANEL_Y * 2,
  r: 0.8,
});

/** Selector modules: LED near the back, knob in the middle, jack near the front. */
export const LED_Y = -31;
export const KNOB_Y = -7;
export const JACK_Y = 27;

export const SKIRT_R = 8.6;
export const SKIRT_H = 1.8;
export const KNOB_R = 6.6;
export const KNOB_Z = PANEL_TOP + SKIRT_H;
export const KNOB_H = 6.2;
export const CAP_R = 5;
export const CAP_H = 1;
export const KNOB_TOP = KNOB_Z + KNOB_H + CAP_H;
export const DETENT_IN = 10.4;
export const DETENT_OUT = 12.6;

/** Plugs: a hex nut on the panel, a barrel, a knurled sleeve and a boot the cable leaves from. */
export const NUT_H = 1;
export const BARREL_Z = PANEL_TOP + NUT_H;
export const SLEEVE_Z = BARREL_Z + 1.6;
export const BOOT_Z = SLEEVE_Z + 4.8;
export const BOOT_TOP = BOOT_Z + 3.6;

const program = moduleOf("program");
/** The program's two output jacks: the left one is patched to Redis, the right one to Emails. */
export const OUT_JACK: Record<Selector, number> = {
  redis: program.x0 + 14,
  emails: program.x1 - 14,
};

export const P = fitProjection(
  [
    ...boxCorners(
      { x: -INNER - CHEEK, y: -DEPTH - 2, w: (INNER + CHEEK) * 2, d: DEPTH * 2 + 4, r: 0 },
      CHEEK_Z0 - FOOT_H,
      CHEEK_TOP,
    ),
    ...Object.values(OUT_JACK).map((x): Point3 => [x, JACK_Y, BOOT_TOP + 12]),
  ],
  WIDTH,
  HEIGHT,
  { pad: 16, azimuth: AZIMUTH, elevation: ELEVATION },
);

export const at = (point: Point3): Flat => iso(point, P);

const RADIANS = Math.PI / 180;
/** A point on a panel at a knob angle (0° toward the back, clockwise seen from above). */
export const polar = (
  cx: number,
  cy: number,
  radius: number,
  degrees: number,
): [number, number] => [
  cx + Math.sin(degrees * RADIANS) * radius,
  cy - Math.cos(degrees * RADIANS) * radius,
];

export const knobAngle = (selector: Selector, index: number) => angleOf(selector, index);
