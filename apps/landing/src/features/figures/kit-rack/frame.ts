import { cameraOf, lineOnTop, type Flat } from "@/components/iso/iso-kit";

import { angleOf, REST, type Selector } from "./model";
import {
  CAP_R,
  KNOB_R,
  KNOB_TOP,
  KNOB_Y,
  P,
  PANEL_TOP,
  SKIRT_H,
  SKIRT_R,
  at,
  centreOf,
  polar,
} from "./view";

/** The pointer is the only part of a knob that changes with its angle; it is rebuilt per frame. */
export function pointerOf(selector: Selector, degrees: number) {
  const cx = centreOf(selector);
  return {
    cap: lineOnTop(
      polar(cx, KNOB_Y, 0.9, degrees),
      polar(cx, KNOB_Y, CAP_R - 0.5, degrees),
      KNOB_TOP,
      P,
    ),
    skirt: lineOnTop(
      polar(cx, KNOB_Y, KNOB_R, degrees),
      polar(cx, KNOB_Y, SKIRT_R, degrees),
      PANEL_TOP + SKIRT_H,
      P,
    ),
  };
}

export const REST_POINTER: Record<Selector, { cap: string; skirt: string }> = {
  redis: pointerOf("redis", angleOf("redis", REST.redis)),
  emails: pointerOf("emails", angleOf("emails", REST.emails)),
};

const fine = (value: number) => Math.round(value * 10) / 10;
const centre = (selector: Selector): Flat => {
  const [x, y] = at([centreOf(selector), KNOB_Y, (PANEL_TOP + KNOB_TOP) / 2]);
  return [fine(x), fine(y)];
};

/** Where each knob sits in the viewBox, for the hit targets laid over the drawing. */
export const KNOB_CENTRE: Record<Selector, Flat> = {
  redis: centre("redis"),
  emails: centre("emails"),
};
export const KNOB_SPAN = fine((SKIRT_R * 2 + 5) * cameraOf(P).k);
