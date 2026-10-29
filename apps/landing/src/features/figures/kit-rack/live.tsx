"use client";

import * as React from "react";

import type { Flat } from "@/components/iso/iso-kit";
import { IsoFigure } from "@/components/iso/react/draw";
import {
  asksForStillness,
  spring,
  useInView,
  useLoop,
  type Spring,
} from "@/components/iso/react/live";

import { KNOB_CENTRE, KNOB_SPAN, REST_POINTER, pointerOf } from "./frame";
import { LAYERS, NAMES, REST, angleOf, lineOf, nextIndex, type Selector } from "./model";
import { HEIGHT, WIDTH } from "./view";

const SELECTORS = ["redis", "emails"] as const;

/** Knobs click into their detent with a little overshoot. */
const STIFFNESS = 210;
const DAMPING = 19;
/** The bead runs at about this many viewBox px per second, eased at both ends. */
const SPEED = 190;
const SHORTEST = 0.7;
const HOLD = 0.55;
const LED_RISE = 0.09;
const LED_FALL = 0.45;
const TOUR_FIRST = 1.4;
const TOUR_BACK = 3.6;

interface Route {
  points: Flat[];
  lengths: number[];
  total: number;
}

const routeOf = (points: Flat[]): Route => {
  const lengths: number[] = [];
  let total = 0;
  let last: Flat | null = null;
  for (const point of points) {
    if (last) total += Math.hypot(point[0] - last[0], point[1] - last[1]);
    lengths.push(total);
    last = point;
  }
  return { points, lengths, total };
};

function along(route: Route, share: number): Flat {
  const want = share * route.total;
  const { points, lengths } = route;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    const from = lengths[index - 1] ?? 0;
    const to = lengths[index] ?? from;
    if (!a || !b || (to < want && index < points.length - 1)) continue;
    const t = Math.min(1, Math.max(0, (want - from) / (to - from || 1)));
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  return points[0] ?? [0, 0];
}

const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};

/** One trip: out along the cable, a pause while the module answers, and back. */
interface Trip {
  selector: Selector;
  age: number;
  leg: number;
}

const legOf = (route: Route) => Math.max(SHORTEST, route.total / SPEED);
const tripLength = (trip: Trip) => trip.leg * 2 + HOLD;

function ledOf(trip: Trip | null, selector: Selector) {
  if (!trip || trip.selector !== selector) return 0;
  const lit = trip.age - trip.leg;
  if (lit < 0) return 0;
  const rise = Math.min(1, lit / LED_RISE);
  const fall = Math.max(0, lit - HOLD - trip.leg * 0.4);
  return rise * Math.exp(-fall / LED_FALL);
}

/** The idle tour, as a list of moments in one cycle. Every other cycle turns a knob first. */
type Moment = { at: number; turn?: Selector; send?: Selector };

function cycleOf(
  count: number,
  legs: Record<Selector, number>,
): { moments: Moment[]; length: number } {
  const moments: Moment[] = [];
  let at = 0.2;
  if (count % 2 === 1) {
    const turn: Selector = count % 4 === 1 ? "redis" : "emails";
    moments.push({ at, turn });
    at += 0.9;
    moments.push({ at, send: turn });
    at += legs[turn] * 2 + HOLD + 0.5;
    const other: Selector = turn === "redis" ? "emails" : "redis";
    moments.push({ at, send: other });
    at += legs[other] * 2 + HOLD + 0.9;
  } else {
    for (const selector of SELECTORS) {
      moments.push({ at, send: selector });
      at += legs[selector] * 2 + HOLD + 0.5;
    }
    at += 0.4;
  }
  return { moments, length: at };
}

interface Props {
  label: string;
  caseBack: React.ReactNode;
  program: React.ReactNode;
  base: Record<Selector, React.ReactNode>;
  skirt: Record<Selector, React.ReactNode>;
  knob: Record<Selector, React.ReactNode>;
  detents: Record<Selector, string[]>;
  lens: Record<Selector, string>;
  glow: Record<Selector, Flat>;
  blank: React.ReactNode;
  caseFront: React.ReactNode;
  plugs: React.ReactNode;
  cables: React.ReactNode;
  routes: Record<Selector, Flat[]>;
}

interface Nodes {
  cap: Record<Selector, SVGPathElement | null>;
  skirt: Record<Selector, SVGPathElement | null>;
  led: Record<Selector, SVGPathElement | null>;
  glow: Record<Selector, SVGCircleElement | null>;
  detents: Record<Selector, (SVGPathElement | null)[]>;
  bead: SVGGElement | null;
}

export function KitRackLive(props: Props) {
  const root = React.useRef<HTMLDivElement | null>(null);
  const visible = useInView(root);
  const routes = React.useMemo(
    () => ({ redis: routeOf(props.routes.redis), emails: routeOf(props.routes.emails) }),
    [props.routes],
  );
  const legs = React.useMemo(
    () => ({ redis: legOf(routes.redis), emails: legOf(routes.emails) }),
    [routes],
  );

  const [index, setIndex] = React.useState<Record<Selector, number>>(REST);
  const [spoken, setSpoken] = React.useState("");
  const chosen = React.useRef<Record<Selector, number>>({ ...REST });
  const knobs = React.useRef<Record<Selector, Spring>>({
    redis: { at: angleOf("redis", REST.redis), rate: 0 },
    emails: { at: angleOf("emails", REST.emails), rate: 0 },
  });
  const trip = React.useRef<Trip | null>(null);
  const nodes = React.useRef<Nodes>({
    cap: { redis: null, emails: null },
    skirt: { redis: null, emails: null },
    led: { redis: null, emails: null },
    glow: { redis: null, emails: null },
    detents: { redis: [], emails: [] },
    bead: null,
  });

  const [engaged, setEngaged] = React.useState(false);
  const [idle, setIdle] = React.useState(false);
  const [poke, setPoke] = React.useState(0);
  const tour = React.useRef({ clock: 0, count: 0, next: 0 });
  const touring = visible && idle && !engaged;
  const touringRef = React.useRef(false);
  React.useEffect(() => {
    touringRef.current = touring;
  }, [touring]);

  const writeReadout = React.useCallback((next: Record<Selector, number>) => {
    const slot = root.current?.closest(".iso-plate")?.querySelector("[data-readout]");
    if (!slot) return;
    for (const selector of SELECTORS) {
      const line = slot.querySelector(`[data-line="${selector}"]`);
      const text = lineOf(selector, next[selector]);
      if (line && line.textContent !== text) line.textContent = text;
    }
  }, []);

  const turn = React.useCallback(
    (selector: Selector) => {
      const next = { ...chosen.current, [selector]: nextIndex(selector, chosen.current[selector]) };
      chosen.current = next;
      setIndex(next);
      writeReadout(next);
      nodes.current.detents[selector].forEach((node, at) =>
        node?.setAttribute("data-tone", at === next[selector] ? "hi" : "lo"),
      );
      return next;
    },
    [writeReadout],
  );

  const send = React.useCallback(
    (selector: Selector) => {
      trip.current = asksForStillness() ? null : { selector, age: 0, leg: legs[selector] };
    },
    [legs],
  );

  const tick = React.useCallback(
    (dt: number, calm: boolean) => {
      let moving = false;

      if (touringRef.current && !calm) {
        const state = tour.current;
        state.clock += dt;
        let cycle = cycleOf(state.count, legs);
        for (
          let moment = cycle.moments[state.next];
          moment && state.clock >= moment.at;
          moment = cycle.moments[state.next]
        ) {
          if (moment.turn) turn(moment.turn);
          if (moment.send) send(moment.send);
          state.next++;
        }
        if (state.clock >= cycle.length) {
          state.clock -= cycle.length;
          state.count++;
          state.next = 0;
          cycle = cycleOf(state.count, legs);
        }
        moving = true;
      }

      for (const selector of SELECTORS) {
        const knob = knobs.current[selector];
        const settled = spring(
          knob,
          angleOf(selector, chosen.current[selector]),
          dt,
          STIFFNESS,
          DAMPING,
          calm,
        );
        if (!settled) moving = true;
        const pointer = pointerOf(selector, knob.at);
        nodes.current.cap[selector]?.setAttribute("d", pointer.cap);
        nodes.current.skirt[selector]?.setAttribute("d", pointer.skirt);
      }

      const now = trip.current;
      if (now) {
        now.age += dt;
        if (now.age >= tripLength(now) + LED_FALL * 4) trip.current = null;
        else moving = true;
      }
      const live = trip.current;
      const bead = nodes.current.bead;
      if (bead) {
        if (live && live.age < tripLength(live)) {
          const route = routes[live.selector];
          const out = live.age < live.leg + HOLD;
          const share = out
            ? smooth(live.age / live.leg)
            : 1 - smooth((live.age - live.leg - HOLD) / live.leg);
          const [x, y] = along(route, share);
          bead.setAttribute(
            "transform",
            `translate(${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10})`,
          );
          bead.style.opacity = `${Math.min(1, live.age / 0.12, (tripLength(live) - live.age) / 0.12)}`;
        } else bead.style.opacity = "0";
      }
      for (const selector of SELECTORS) {
        const level = `${Math.round(ledOf(live, selector) * 1000) / 1000}`;
        const led = nodes.current.led[selector];
        const glow = nodes.current.glow[selector];
        if (led && led.style.opacity !== level) led.style.opacity = level;
        if (glow && glow.style.opacity !== level)
          glow.style.opacity = `${Math.round(Number(level) * 600) / 1000}`;
      }
      return moving;
    },
    [legs, routes, send, turn],
  );

  const kick = useLoop(tick, visible);

  React.useEffect(() => {
    if (engaged) return;
    const timer = window.setTimeout(() => setIdle(true), (poke ? TOUR_BACK : TOUR_FIRST) * 1000);
    return () => window.clearTimeout(timer);
  }, [engaged, poke]);

  React.useEffect(() => {
    if (touring) kick();
  }, [touring, kick]);

  const press = (selector: Selector) => {
    setIdle(false);
    setPoke((count) => count + 1);
    const next = turn(selector);
    send(selector);
    setSpoken(
      `${NAMES[selector]} now provides ${LAYERS[selector][next[selector]]}. The program is unchanged.`,
    );
    kick();
  };

  const bind =
    <K extends "cap" | "skirt" | "led" | "glow">(key: K, selector: Selector) =>
    (node: Nodes[K][Selector]) => {
      nodes.current[key][selector] = node;
    };

  return (
    <div
      ref={root}
      className="kr-stage"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        setEngaged(true);
        setIdle(false);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          setEngaged(false);
          setPoke((count) => count + 1);
        }
      }}
      onFocus={() => {
        setEngaged(true);
        setIdle(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setEngaged(false);
          setPoke((count) => count + 1);
        }
      }}
    >
      <IsoFigure width={WIDTH} height={HEIGHT} label={props.label}>
        {props.caseBack}
        {props.program}
        {SELECTORS.map((selector) => (
          <g key={selector}>
            {props.base[selector]}
            {props.detents[selector].map((d, at) => (
              <path
                key={d}
                ref={(node) => {
                  nodes.current.detents[selector][at] = node;
                }}
                className="iso-line"
                data-tone={at === REST[selector] ? "hi" : "lo"}
                d={d}
              />
            ))}
            <path
              ref={bind("led", selector)}
              className="kr-led"
              d={props.lens[selector]}
              style={{ opacity: 0 }}
            />
            <circle
              ref={bind("glow", selector)}
              className="kr-glow"
              cx={props.glow[selector][0]}
              cy={props.glow[selector][1]}
              r={6}
              style={{ opacity: 0 }}
            />
            {props.skirt[selector]}
            <path
              ref={bind("skirt", selector)}
              className="iso-line"
              data-tone="hi"
              d={REST_POINTER[selector].skirt}
            />
            {props.knob[selector]}
            <path
              ref={bind("cap", selector)}
              className="iso-line kr-pointer"
              data-tone="hi"
              data-free=""
              d={REST_POINTER[selector].cap}
            />
          </g>
        ))}
        {props.blank}
        {props.caseFront}
        {props.plugs}
        {props.cables}
        <g
          ref={(node) => {
            nodes.current.bead = node;
          }}
          className="kr-bead"
          style={{ opacity: 0 }}
        >
          <circle r={3.8} className="kr-bead-ring" />
          <circle r={2.6} className="kr-bead-dot" />
        </g>
      </IsoFigure>
      {SELECTORS.map((selector) => {
        const current = LAYERS[selector][index[selector]];
        const next = LAYERS[selector][nextIndex(selector, index[selector])];
        const [x, y] = KNOB_CENTRE[selector];
        return (
          <button
            key={selector}
            type="button"
            className="kr-knob"
            style={{
              left: `${(x / WIDTH) * 100}%`,
              top: `${(y / HEIGHT) * 100}%`,
              width: `max(44px, ${(KNOB_SPAN / WIDTH) * 100}%)`,
            }}
            aria-label={`${NAMES[selector]} selector, set to ${current}. Turn to ${next}.`}
            onClick={() => press(selector)}
          />
        );
      })}
      <span className="kr-sr" aria-live="polite">
        {spoken}
      </span>
    </div>
  );
}
