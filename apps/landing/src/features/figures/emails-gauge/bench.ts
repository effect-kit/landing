import { follow, spring, type Spring } from "@/components/iso/react/live";

import { pointerAngle } from "./frame";
import { outcomeOf, stationAt, type Setup } from "./model";
import {
  BACK_X,
  BED_Z,
  BLADE_W,
  BLADE_X,
  DROP_X,
  FEELER_X,
  GAP_NARROW,
  GAP_WIDE,
  LETTER_W,
  LOAD_X,
  OUT_FLOOR,
  OUT_X,
  ROLLER_R,
  STOP_X,
  THICK,
  THIN,
} from "./view";

/**
 * The bench as a small simulation, free of the DOM: a letter driven by rollers at a steady
 * speed, a gate blade and dial pointer on springs, a reject flag that swings up on a stiff,
 * lightly damped spring, gravity for the drop into the out tray, and a counter wheel.
 */

const SPEED = 62;
const RETURN_SPEED = 120;
const GRAVITY = 420;
const UP = Math.PI / 2;

export type Phase = "fadeout" | "return" | "load" | "feed" | "stopped" | "fall" | "out";

export interface Sim {
  setup: Setup;
  phase: Phase;
  decided: boolean;
  x: Spring;
  z: number;
  vz: number;
  h: number;
  clip: number;
  fade: number;
  wait: number;
  blade: Spring;
  dial: Spring;
  flag: Spring;
  roll: number;
  lift: number;
  digit: number;
  held: number;
}

const thicknessOf = (setup: Setup) => (setup.attached ? THICK : THIN);
const gapOf = (setup: Setup) => (stationAt(setup.station).attachments ? GAP_WIDE : GAP_NARROW);

export function settledSim(setup: Setup): Sim {
  const rejected = outcomeOf(setup).kind === "rejected";
  return {
    setup,
    phase: rejected ? "stopped" : "out",
    decided: true,
    x: { at: rejected ? BACK_X : OUT_X, rate: 0 },
    z: rejected ? BED_Z : OUT_FLOOR,
    vz: 0,
    h: thicknessOf(setup),
    clip: setup.attached ? 1 : 0,
    fade: 1,
    wait: 0,
    blade: { at: gapOf(setup), rate: 0 },
    dial: { at: pointerAngle(setup.station), rate: 0 },
    flag: { at: rejected ? UP : 0, rate: 0 },
    roll: 0,
    lift: 0,
    digit: rejected ? 0 : 1,
    held: 0,
  };
}

/** One step of the bench. Returns true while anything still moves. */
export function step(sim: Sim, dt: number): boolean {
  const { setup } = sim;
  const rejected = outcomeOf(setup).kind === "rejected";
  const thick = thicknessOf(setup);
  const before = sim.x.at;
  let moving = true;

  spring(sim.blade, gapOf(setup), dt, 90, 16);
  spring(sim.dial, pointerAngle(setup.station), dt, 120, 17);
  const flagWanted = sim.phase === "stopped" && rejected ? UP : 0;
  spring(sim.flag, flagWanted, dt, flagWanted ? 260 : 140, flagWanted ? 12 : 22);

  switch (sim.phase) {
    case "fadeout": {
      sim.fade = follow(sim.fade, 0, dt, 0.1);
      if (sim.fade < 0.02) {
        sim.fade = 0;
        sim.x = { at: LOAD_X, rate: 0 };
        sim.z = BED_Z;
        sim.vz = 0;
        sim.phase = "load";
        sim.wait = 0;
      }
      break;
    }
    case "return": {
      sim.x.rate = follow(sim.x.rate, -RETURN_SPEED, dt, 0.12);
      sim.x.at += sim.x.rate * dt;
      if (sim.x.at <= LOAD_X) {
        sim.x = { at: LOAD_X, rate: 0 };
        sim.phase = "load";
        sim.wait = 0;
      }
      break;
    }
    case "load": {
      sim.fade = follow(sim.fade, 1, dt, 0.12);
      sim.h = follow(sim.h, thick, dt, 0.16);
      sim.clip = follow(sim.clip, setup.attached ? 1 : 0, dt, 0.14);
      sim.wait += dt;
      const ready =
        sim.wait > 0.5 &&
        Math.abs(sim.h - thick) < 0.04 &&
        Math.abs(sim.blade.at - gapOf(setup)) < 0.08 &&
        sim.fade > 0.97;
      if (ready) {
        sim.fade = 1;
        sim.h = thick;
        sim.clip = setup.attached ? 1 : 0;
        sim.phase = "feed";
      }
      break;
    }
    case "feed": {
      sim.x.rate = follow(sim.x.rate, SPEED, dt, 0.2);
      sim.x.at += sim.x.rate * dt;
      const lead = sim.x.at + LETTER_W / 2;
      if (rejected && sim.x.at >= STOP_X) {
        sim.x = { at: STOP_X, rate: -6 };
        sim.phase = "stopped";
        sim.decided = true;
      } else if (!rejected && lead >= BLADE_X + BLADE_W && !sim.decided) {
        sim.decided = true;
      }
      if (!rejected && sim.x.at >= DROP_X) {
        sim.phase = "fall";
        sim.vz = 0;
      }
      break;
    }
    case "stopped": {
      const still = spring(sim.x, BACK_X, dt, 70, 13);
      moving = !still || sim.flag.at !== flagWanted;
      break;
    }
    case "fall": {
      sim.vz -= GRAVITY * dt;
      sim.z += sim.vz * dt;
      sim.x.at = follow(sim.x.at, OUT_X, dt, 0.14);
      if (sim.z <= OUT_FLOOR) {
        sim.z = OUT_FLOOR;
        sim.vz = 0;
        sim.phase = "out";
      }
      break;
    }
    case "out": {
      sim.x.at = follow(sim.x.at, OUT_X, dt, 0.14);
      moving = sim.x.at !== OUT_X;
      break;
    }
  }

  const drive = sim.phase === "feed" || sim.phase === "return" || sim.phase === "stopped";
  if (drive) sim.roll += (sim.x.at - before) / ROLLER_R;
  const under = Math.abs(sim.x.at - FEELER_X) < LETTER_W / 2 - 1 && sim.z >= BED_Z - 0.01;
  sim.lift = follow(sim.lift, under ? sim.h : 0, dt, 0.05);
  const counted = sim.decided && !rejected ? 1 : 0;
  sim.digit = follow(sim.digit, counted, dt, 0.09);

  const settledParts =
    sim.blade.at === gapOf(setup) &&
    sim.dial.at === pointerAngle(setup.station) &&
    sim.flag.at === flagWanted &&
    sim.digit === counted &&
    sim.lift === (under ? sim.h : 0);
  return moving || !settledParts;
}

export function begin(sim: Sim, setup: Setup) {
  sim.setup = setup;
  sim.decided = false;
  sim.held = 0;
  if (sim.phase === "fall" || sim.phase === "out") sim.phase = "fadeout";
  else if (sim.phase !== "fadeout") {
    sim.phase = "return";
    sim.x.rate = Math.min(sim.x.rate, 0);
  }
}
