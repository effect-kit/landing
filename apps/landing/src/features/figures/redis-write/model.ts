import type { Point3 } from "@/components/iso/iso-kit";

import {
  ARRIVE_X,
  CLIENT_FACE,
  HINGE_X,
  JAW_X,
  LINE_Z,
  OPEN_ANGLE,
  QUEUED_X,
  SPAWN_X,
  TRAY_TO,
} from "./view";

/**
 * The bench, as a model of @effect-kit/redis. A command waits in the client's queue until it
 * is written to the socket; the gate on the send tray is that moment. If the connection drops,
 * every command without a reply fails with a ConnectionError whose `delivery` says how far it
 * got: still queued is "unsent", anything already written is "possibly-written", whether or not
 * it reached the server (connection/Generation.ts). The client never resends on its own; the
 * program does, as in the "redis.uncertain" snippet: resend when unsent, read the key when not.
 */

export type Delivery = "unsent" | "possibly-written";
export type Phase = "spawn" | "queued" | "flight" | "server" | "reply" | "done" | "failed";
type Why = "new" | "again" | "readback";

export interface Bead {
  x: number;
  alpha: number;
  alive: boolean;
  /** Written on a connection that has since dropped: it ends where it is, or at the server. */
  orphan: boolean;
}

export interface Sim {
  phase: Phase;
  phaseT: number;
  order: number;
  op: "SET" | "GET";
  why: Why;
  cmd: Bead;
  reply: Bead;
  speed: number;
  gate: number;
  open: boolean;
  angle: number;
  angleRate: number;
  link: boolean;
  handshake: number;
  applied: number;
  roll: number;
  stored: number[];
  error: Delivery | null;
  value: "paid" | "nil" | null;
  activity: number;
  /** Bumped whenever the words change, so the live layer only writes text when it must. */
  version: number;
}

export const FIRST_ORDER = 42;
const SPEED = 74;
const SPAWN_TIME = 0.7;
const QUEUE_TIME = 1.1;
const AGAIN_TIME = 0.5;
const SERVER_TIME = 0.45;
const DONE_TIME = 1.9;
const HANDSHAKE = 0.5;
const FADE = 0.45;
const RECEIVED_X = CLIENT_FACE + 5;

const bead = (x: number, alive: boolean): Bead => ({
  x,
  alpha: alive ? 1 : 0,
  alive,
  orphan: false,
});

export function startSim(): Sim {
  return {
    phase: "queued",
    phaseT: 0,
    order: FIRST_ORDER,
    op: "SET",
    why: "new",
    cmd: bead(QUEUED_X, true),
    reply: bead(ARRIVE_X, false),
    speed: 0,
    gate: 0,
    open: false,
    angle: 0,
    angleRate: 0,
    link: true,
    handshake: 0,
    applied: 0,
    roll: 0,
    stored: [],
    error: null,
    value: null,
    activity: 0,
    version: 0,
  };
}

const key = (sim: Sim) => `order:${sim.order}`;
export const commandText = (sim: Sim) =>
  sim.op === "SET" ? `SET ${key(sim)} paid` : `GET ${key(sim)}`;

function enter(sim: Sim, phase: Phase) {
  sim.phase = phase;
  sim.phaseT = 0;
  sim.version++;
}

function nextCommand(sim: Sim, op: "SET" | "GET", why: Why) {
  sim.op = op;
  sim.why = why;
  sim.cmd = bead(SPAWN_X, true);
  sim.cmd.alpha = 0;
  sim.value = null;
  enter(sim, "spawn");
}

/** The program's answer to the error, as in the snippet: resend when unsent, read back when not. */
function recover(sim: Sim) {
  const delivery = sim.error;
  sim.error = null;
  if (delivery === "unsent") {
    sim.why = "again";
    enter(sim, "queued");
  } else {
    nextCommand(sim, "GET", "readback");
  }
}

/** The next order, marked paid. Under reduced motion this waits for the reader's next throw. */
export function nextOrder(sim: Sim) {
  sim.order = sim.order >= FIRST_ORDER + 57 ? FIRST_ORDER : sim.order + 1;
  nextCommand(sim, "SET", "new");
}

/** The blade turns about the hinge pin, so a point on it rises with the blade. */
export function pointOf(x: number, angle: number): Point3 {
  if (angle <= 0 || x < JAW_X - 3 || x > HINGE_X) return [x, 0, LINE_Z];
  const reach = HINGE_X - x;
  return [HINGE_X - reach * Math.cos(angle), 0, LINE_Z + reach * Math.sin(angle)];
}

function cut(sim: Sim) {
  sim.link = false;
  sim.version++;
  const { phase } = sim;
  if (phase === "spawn" || phase === "queued") {
    sim.error = "unsent";
    enter(sim, "failed");
    return;
  }
  if (phase === "done" || phase === "failed") return;
  if (phase === "reply" && sim.reply.x < JAW_X) return;
  sim.error = "possibly-written";
  if (sim.cmd.alive) sim.cmd.orphan = true;
  if (sim.reply.alive) sim.reply.orphan = true;
  enter(sim, "failed");
}

export function throwSwitch(sim: Sim, open = !sim.open) {
  if (sim.open === open) return;
  sim.open = open;
  sim.version++;
}

function moveSwitch(sim: Sim, dt: number, calm: boolean) {
  const target = sim.open ? OPEN_ANGLE : 0;
  if (calm) {
    sim.angle = target;
    sim.angleRate = 0;
  } else {
    const steps = Math.max(1, Math.ceil(dt * 240));
    const slice = dt / steps;
    for (let tick = 0; tick < steps; tick++) {
      const stiffness = sim.open ? 70 : 110;
      sim.angleRate += ((target - sim.angle) * stiffness - sim.angleRate * 13) * slice;
      sim.angle += sim.angleRate * slice;
      if (!sim.open && sim.angle < 0) {
        sim.angle = 0;
        sim.angleRate = 0;
      }
    }
    if (Math.abs(target - sim.angle) < 4e-4 && Math.abs(sim.angleRate) < 4e-4) {
      sim.angle = target;
      sim.angleRate = 0;
    }
  }
  if (sim.link && sim.angle > 0.04) cut(sim);
  if (!sim.link && !sim.open && sim.angle === 0) {
    sim.handshake += dt;
    if (sim.handshake >= HANDSHAKE || calm) {
      sim.handshake = 0;
      sim.link = true;
      sim.version++;
    }
  } else sim.handshake = 0;
}

function fadeOut(item: Bead, dt: number, calm: boolean) {
  item.alpha = calm ? 0 : Math.max(0, item.alpha - dt / FADE);
  if (item.alpha === 0) item.alive = false;
}

function moveBeads(sim: Sim, dt: number, calm: boolean) {
  const { cmd, reply } = sim;
  const flying = sim.phase === "flight" || (cmd.orphan && cmd.alive && cmd.x >= JAW_X);
  if (flying) {
    sim.speed = calm ? SPEED : sim.speed + (SPEED - sim.speed) * (1 - Math.exp(-dt / 0.22));
    cmd.x = calm ? ARRIVE_X : Math.min(ARRIVE_X, cmd.x + sim.speed * dt);
    if (cmd.x >= ARRIVE_X) arrive(sim);
  }
  if (cmd.alive && cmd.orphan && cmd.x < JAW_X) fadeOut(cmd, dt, calm);
  if (sim.phase === "reply" && reply.alive && !reply.orphan) {
    reply.x = calm ? RECEIVED_X : Math.max(RECEIVED_X, reply.x - SPEED * dt);
    reply.alpha = Math.min(1, reply.alpha + dt / 0.2, Math.max(0, (reply.x - RECEIVED_X) / 5));
    if (reply.x <= RECEIVED_X) received(sim);
  }
  if (reply.alive && reply.orphan) fadeOut(reply, dt, calm);
}

function arrive(sim: Sim) {
  const { cmd } = sim;
  cmd.alive = false;
  cmd.alpha = 0;
  sim.speed = 0;
  if (sim.op === "SET" && !sim.stored.includes(sim.order)) {
    sim.stored.push(sim.order);
    sim.applied++;
  }
  sim.activity = 1;
  sim.version++;
  if (cmd.orphan) return;
  enter(sim, "server");
}

function received(sim: Sim) {
  sim.reply.alive = false;
  sim.reply.alpha = 0;
  if (sim.op === "GET") sim.value = sim.stored.includes(sim.order) ? "paid" : "nil";
  enter(sim, "done");
}

export function step(sim: Sim, dt: number, calm: boolean) {
  sim.phaseT += dt;
  moveSwitch(sim, dt, calm);
  moveBeads(sim, dt, calm);
  sim.activity = Math.max(0, sim.activity - dt / 0.6);
  sim.roll = calm ? sim.applied : sim.roll + (sim.applied - sim.roll) * (1 - Math.exp(-dt / 0.16));
  if (Math.abs(sim.applied - sim.roll) < 1e-3) sim.roll = sim.applied;

  const { cmd } = sim;
  switch (sim.phase) {
    case "spawn": {
      const share = calm ? 1 : Math.min(1, sim.phaseT / SPAWN_TIME);
      const eased = 1 - (1 - share) ** 3;
      cmd.x = SPAWN_X + (QUEUED_X - SPAWN_X) * eased;
      cmd.alpha = Math.min(1, share * 2.5);
      if (share >= 1) enter(sim, "queued");
      break;
    }
    case "queued": {
      const hold = sim.why === "again" ? AGAIN_TIME : QUEUE_TIME;
      if (sim.link && (calm ? sim.why !== "new" : sim.phaseT >= hold)) enter(sim, "flight");
      break;
    }
    case "flight":
      break;
    case "server":
      if (sim.phaseT >= SERVER_TIME || calm) {
        sim.reply = bead(ARRIVE_X, true);
        sim.reply.alpha = 0;
        enter(sim, "reply");
      }
      break;
    case "reply":
      break;
    case "done":
      if (sim.link && !calm && sim.phaseT >= DONE_TIME) nextOrder(sim);
      break;
    case "failed":
      if (sim.link && !(sim.cmd.alive && sim.cmd.orphan) && !(sim.reply.alive && sim.reply.orphan))
        recover(sim);
      break;
  }

  const gateWant = sim.phase === "flight" && cmd.x < TRAY_TO + 4 ? 1 : 0;
  sim.gate = calm ? gateWant : sim.gate + (gateWant - sim.gate) * (1 - Math.exp(-dt / 0.09));
  if (Math.abs(gateWant - sim.gate) < 1e-3) sim.gate = gateWant;
}

/** Under reduced motion the bench only moves when thrown, and rests once nothing would change. */
export function resting(sim: Sim, calm: boolean) {
  if (sim.angle !== (sim.open ? OPEN_ANGLE : 0) || sim.gate !== 0 || sim.roll !== sim.applied)
    return false;
  if (!calm) return false;
  if (sim.phase === "queued") return sim.why === "new" || !sim.link;
  if (sim.phase === "done") return true;
  return sim.phase === "failed" && !sim.link;
}

export interface Words {
  line1: string;
  line2: string;
  readout: string;
  spoken: string;
}

export function wordsOf(sim: Sim): Words {
  const command = commandText(sim);
  if (sim.phase === "failed" && sim.error) {
    const unsent = sim.error === "unsent";
    return {
      line1: "ConnectionError",
      line2: sim.error,
      readout: unsent
        ? `delivery: "unsent" · safe to resend`
        : `delivery: "possibly-written" · read first`,
      spoken: unsent
        ? `Connection cut while ${command} was still queued. ConnectionError, delivery unsent: it never reached Redis, so it is safe to send again.`
        : `Connection cut after ${command} was written. ConnectionError, delivery possibly-written: Redis may have applied it, so the program reads the key back instead of resending.`,
    };
  }
  if (!sim.link && (sim.phase === "done" || sim.phase === "failed")) {
    return {
      line1: command,
      line2: "link down",
      readout: "link down · nothing in flight",
      spoken: "Connection cut with nothing in flight.",
    };
  }
  switch (sim.phase) {
    case "spawn":
    case "queued":
      if (sim.why === "again") {
        return {
          line1: command,
          line2: "sending again",
          readout: "unsent, so sent again",
          spoken: `Reconnected. ${command} was unsent, so it is sent again.`,
        };
      }
      if (sim.why === "readback") {
        return {
          line1: command,
          line2: "queued",
          readout: `${command} · reading back`,
          spoken: `Reconnected. Reading ${key(sim)} back to see whether the write landed.`,
        };
      }
      return {
        line1: command,
        line2: "queued",
        readout: `${command} · queued`,
        spoken: `${command} is queued in the client.`,
      };
    case "flight":
    case "server":
    case "reply":
      return {
        line1: command,
        line2: "written",
        readout: `${command} · written`,
        spoken: `${command} is written to the connection.`,
      };
    case "done":
    case "failed":
      if (sim.op === "GET") {
        const landed = sim.value === "paid";
        return {
          line1: command,
          line2: landed ? `"paid"` : "(nil)",
          readout: landed ? `read back "paid" · not resent` : "read back nil · it never landed",
          spoken: landed
            ? `${key(sim)} reads "paid": the write was applied once, and was not sent twice.`
            : `${key(sim)} reads nil: the write never reached Redis.`,
        };
      }
      return {
        line1: command,
        line2: "OK",
        readout: `${command} → OK`,
        spoken: `${command} replied OK.`,
      };
  }
}
