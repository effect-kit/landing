"use client";

import * as React from "react";

import { IsoFigure } from "@/components/iso/react/draw";
import { asksForStillness, useInView, useLoop, useReadout } from "@/components/iso/react/live";

import { WHEEL_DIGITS, WHEEL_PITCH, WHEEL_W } from "./art";
import { CLIENT_ART, SERVER_ART, bladeOf, gateOf } from "./geometry";
import { nextOrder, resting, startSim, step, throwSwitch, wordsOf, type Sim } from "./model";
import {
  CommandBead,
  DIGIT_SIZE,
  fine,
  SPLIT_X,
  MovingSolid,
  placeBead,
  ReplyBead,
  solidNodes,
  WINDOW_H,
  wheelPositions,
  wheelShift,
  writeSolid,
} from "./parts";
import { HEIGHT, JAW_X, LUG_W, WIDTH } from "./view";

const TOUR_FIRST = 1.4;
const TOUR_BACK = 3.6;
const HOLD_OPEN = 1.7;
type Plan = "none" | "queued" | "past" | "lost";
const TOUR: Plan[] = ["none", "queued", "past", "none", "lost"];
const tourPlan = (cycle: number): Plan => TOUR[cycle % TOUR.length] ?? "none";

const REST = startSim();
const REST_WORDS = wordsOf(REST);
const REST_BLADE = bladeOf(0);
const REST_GATE = gateOf(0);

interface Nodes {
  cmd1: SVGGElement | null;
  cmd2: SVGGElement | null;
  reply1: SVGGElement | null;
  reply2: SVGGElement | null;
  line1: SVGTextElement | null;
  line2: SVGTextElement | null;
  wheels: (SVGGElement | null)[];
  clientLink: SVGCircleElement | null;
  serverLink: SVGCircleElement | null;
  activity: SVGCircleElement | null;
  bay: SVGCircleElement | null;
  spoken: HTMLSpanElement | null;
}

interface Props {
  label: string;
  art: {
    bench: React.ReactNode;
    client: React.ReactNode;
    screenClip: React.ReactNode;
    screenBack: React.ReactNode;
    screenRim: React.ReactNode;
    returnA: React.ReactNode;
    trayBack: React.ReactNode;
    switchBase: React.ReactNode;
    backPoleBase: React.ReactNode;
    backPoleFront: React.ReactNode;
    frontPoleBase: React.ReactNode;
    trayFront: React.ReactNode;
    frontPoleFront: React.ReactNode;
    lineB: React.ReactNode;
    server: React.ReactNode;
    counterClip: React.ReactNode;
    counterBack: React.ReactNode;
    counterFront: React.ReactNode;
  };
}

export function RedisWriteLive({ label, art }: Props) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const sim = React.useRef<Sim>(startSim());
  const nodes = React.useRef<Nodes>({
    cmd1: null,
    cmd2: null,
    reply1: null,
    reply2: null,
    line1: null,
    line2: null,
    wheels: [null, null, null, null],
    clientLink: null,
    serverLink: null,
    activity: null,
    bay: null,
    spoken: null,
  });
  const solids = React.useRef({
    blade: solidNodes(),
    blade2: solidNodes(),
    crossbar: solidNodes(),
    stem: solidNodes(),
    ferrule: solidNodes(),
    grip: solidNodes(),
    gate: solidNodes(),
  });
  const shown = React.useRef({ angle: 0, gate: 0, roll: 0, version: -1, link: true, spoken: "" });
  const tour = React.useRef({
    clock: 0,
    idle: TOUR_FIRST,
    cycle: 0,
    order: REST.order,
    plan: tourPlan(0),
    thrown: false,
    openFor: 0,
  });
  const [connected, setConnected] = React.useState(true);
  const visible = useInView(anchor);

  const bind =
    <K extends keyof Nodes>(key: K) =>
    (node: Nodes[K]) => {
      nodes.current[key] = node;
    };

  const draw = React.useCallback(() => {
    const s = sim.current;
    const n = nodes.current;
    const was = shown.current;
    if (s.angle !== was.angle) {
      const parts = bladeOf(s.angle);
      writeSolid(solids.current.blade, parts.blade);
      writeSolid(solids.current.blade2, parts.blade2);
      writeSolid(solids.current.crossbar, parts.crossbar);
      writeSolid(solids.current.stem, parts.stem);
      writeSolid(solids.current.ferrule, parts.ferrule);
      writeSolid(solids.current.grip, parts.grip);
      was.angle = s.angle;
    }
    if (s.gate !== was.gate) {
      writeSolid(solids.current.gate, gateOf(s.gate));
      was.gate = s.gate;
    }
    placeBead(n.cmd1, s.cmd, s.angle, 1);
    placeBead(n.cmd2, s.cmd, s.angle, 2);
    placeBead(n.reply1, s.reply, s.angle, 1);
    placeBead(n.reply2, s.reply, s.angle, 2);
    if (s.roll !== was.roll) {
      wheelPositions(s.roll).forEach((position, index) =>
        n.wheels[index]?.setAttribute("transform", wheelShift(position)),
      );
      was.roll = s.roll;
    }
    n.activity?.style.setProperty("opacity", `${fine(0.25 + s.activity * 0.75)}`);
    n.bay?.style.setProperty("opacity", `${fine(0.25 + s.activity * 0.75)}`);
    if (s.version !== was.version) {
      const words = wordsOf(s);
      if (n.line1 && n.line1.textContent !== words.line1) n.line1.textContent = words.line1;
      if (n.line2 && n.line2.textContent !== words.line2) n.line2.textContent = words.line2;
      say(words.readout);
      if (n.spoken && words.spoken !== was.spoken) {
        n.spoken.textContent = words.spoken;
        was.spoken = words.spoken;
      }
      if (n.line1) {
        if (s.phase === "failed" && s.error) n.line1.dataset.error = "";
        else delete n.line1.dataset.error;
      }
      was.version = s.version;
    }
    if (s.link !== was.link) {
      for (const led of [n.clientLink, n.serverLink])
        led?.setAttribute("data-on", s.link ? "true" : "false");
      was.link = s.link;
    }
    // Everything else it reads lives in refs, which are stable for the component lifetime.
    // oxlint-disable-next-line react/memo-dependencies
  }, [say]);

  const runTour = (dt: number) => {
    const t = tour.current;
    const s = sim.current;
    if (t.idle > 0) {
      t.idle -= dt;
      return;
    }
    if (s.order !== t.order && s.phase === "spawn" && s.why === "new") {
      t.order = s.order;
      t.cycle = (t.cycle + 1) % TOUR.length;
      t.plan = tourPlan(t.cycle);
      t.thrown = false;
    }
    if (s.open) {
      t.openFor += dt;
      if (t.openFor >= HOLD_OPEN) {
        throwSwitch(s, false);
        setConnected(true);
      }
      return;
    }
    t.openFor = 0;
    if (t.thrown || !s.link) return;
    const ready =
      (t.plan === "queued" && s.phase === "queued" && s.why === "new" && s.phaseT > 0.5) ||
      (t.plan === "past" && s.phase === "flight" && s.cmd.x > SPLIT_X + 6) ||
      (t.plan === "lost" && s.phase === "flight" && s.cmd.x > JAW_X - LUG_W - 26);
    if (ready) {
      t.thrown = true;
      throwSwitch(s, true);
      setConnected(false);
    }
  };

  const kick = useLoop((dt, calm) => {
    const s = sim.current;
    if (!calm) runTour(dt);
    if (calm) for (let index = 0; index < 24 && !resting(s, true); index++) step(s, 1 / 30, true);
    else step(s, dt, false);
    draw();
    return !calm || !resting(s, true);
  }, visible);

  const throwIt = () => {
    const s = sim.current;
    tour.current.idle = TOUR_BACK;
    tour.current.openFor = 0;
    if (asksForStillness() && s.phase === "done" && s.link && !s.open) {
      nextOrder(s);
      step(s, 1 / 30, true);
    }
    throwSwitch(s);
    setConnected(!s.open);
    kick();
  };

  React.useEffect(() => {
    if (asksForStillness()) tour.current.idle = Infinity;
  }, []);

  const hold = () => {
    tour.current.idle = Math.max(tour.current.idle, TOUR_BACK);
  };

  return (
    <>
      <span id="rw-spoken" ref={bind("spoken")} className="rw-sr" aria-live="polite">
        {REST_WORDS.spoken}
      </span>
      <div
        ref={anchor}
        tabIndex={0}
        role="switch"
        aria-checked={connected}
        aria-label="Knife switch on the connection between the client and Redis. Press Enter or Space to cut or restore it."
        aria-describedby="rw-spoken"
        className="rw-stage"
        onClick={throwIt}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          if (!event.repeat) throwIt();
        }}
        onPointerEnter={hold}
        onFocus={hold}
      >
        <IsoFigure width={WIDTH} height={HEIGHT} label={label}>
          <defs>
            {art.screenClip}
            {art.counterClip}
          </defs>
          {art.bench}
          {art.client}
          {art.screenBack}
          <g clipPath="url(#rw-screen)">
            <g transform={CLIENT_ART.screen.plane}>
              <text ref={bind("line1")} className="rw-display" x={3.2} y={7.2} fontSize={4.7}>
                {REST_WORDS.line1}
              </text>
              <text
                ref={bind("line2")}
                className="rw-display rw-display-small"
                x={3.2}
                y={13.6}
                fontSize={3.9}
              >
                {REST_WORDS.line2}
              </text>
            </g>
          </g>
          {art.screenRim}
          <g transform={CLIENT_ART.frontPlane}>
            <circle
              ref={bind("clientLink")}
              className="rw-led"
              data-on="true"
              cx={CLIENT_ART.leds[0]?.[0] ?? 0}
              cy={CLIENT_ART.leds[0]?.[1] ?? 0}
              r={1}
            />
            <circle
              className="rw-led"
              data-on="false"
              cx={CLIENT_ART.leds[1]?.[0] ?? 0}
              cy={CLIENT_ART.leds[1]?.[1] ?? 0}
              r={1}
            />
          </g>
          {art.returnA}
          {art.trayBack}
          {art.switchBase}
          {art.backPoleBase}
          <MovingSolid nodes={() => solids.current.blade2} paths={REST_BLADE.blade2} tone="mid" />
          {art.backPoleFront}
          {art.frontPoleBase}
          <MovingSolid nodes={() => solids.current.blade} paths={REST_BLADE.blade} tone="hi" />
          <CommandBead bind={bind("cmd1")} x={REST.cmd.x} />
          <ReplyBead bind={bind("reply1")} />
          <MovingSolid nodes={() => solids.current.gate} paths={REST_GATE} tone="mid" />
          {art.trayFront}
          {art.frontPoleFront}
          <MovingSolid
            nodes={() => solids.current.crossbar}
            paths={REST_BLADE.crossbar}
            tone="mid"
          />
          <MovingSolid nodes={() => solids.current.stem} paths={REST_BLADE.stem} tone="mid" />
          <MovingSolid nodes={() => solids.current.ferrule} paths={REST_BLADE.ferrule} tone="mid" />
          <MovingSolid
            nodes={() => solids.current.grip}
            paths={REST_BLADE.grip}
            tone="hi"
            className="rw-grip"
          />
          {art.lineB}
          <CommandBead bind={bind("cmd2")} x={REST.cmd.x + 1000} />
          <ReplyBead bind={bind("reply2")} />
          {art.server}
          {art.counterBack}
          <g clipPath="url(#rw-counter)">
            <g transform={SERVER_ART.counter.plane}>
              {wheelPositions(0).map((position, index) => (
                // Wheels are a fixed row whose position is their identity.
                // oxlint-disable-next-line react/no-array-index-key
                <g
                  key={index}
                  transform={`translate(${fine(index * WHEEL_W + WHEEL_W / 2)} ${fine(WINDOW_H / 2 + DIGIT_SIZE * 0.36)})`}
                >
                  <g
                    ref={(node) => {
                      nodes.current.wheels[index] = node;
                    }}
                    transform={wheelShift(position)}
                  >
                    {WHEEL_DIGITS.map((digit, row) => (
                      <text
                        key={`${digit}-${row}`}
                        className="rw-display rw-digit"
                        y={fine(row * WHEEL_PITCH)}
                        fontSize={DIGIT_SIZE}
                        textAnchor="middle"
                      >
                        {digit}
                      </text>
                    ))}
                  </g>
                </g>
              ))}
            </g>
          </g>
          {art.counterFront}
          <g transform={SERVER_ART.frontPlane}>
            <circle
              className="rw-led"
              data-on="true"
              cx={SERVER_ART.leds[0]?.[0] ?? 0}
              cy={SERVER_ART.leds[0]?.[1] ?? 0}
              r={1}
            />
            <circle
              ref={bind("serverLink")}
              className="rw-led"
              data-on="true"
              cx={SERVER_ART.leds[1]?.[0] ?? 0}
              cy={SERVER_ART.leds[1]?.[1] ?? 0}
              r={1}
            />
            <circle
              ref={bind("activity")}
              className="rw-led"
              data-on="true"
              style={{ opacity: 0.25 }}
              cx={SERVER_ART.leds[2]?.[0] ?? 0}
              cy={SERVER_ART.leds[2]?.[1] ?? 0}
              r={1}
            />
            <circle
              ref={bind("bay")}
              className="rw-led"
              data-on="true"
              style={{ opacity: 0.25 }}
              cx={SERVER_ART.bayLeds[0]?.[0] ?? 0}
              cy={SERVER_ART.bayLeds[0]?.[1] ?? 0}
              r={0.8}
            />
            <g className="rw-led-row">
              {SERVER_ART.bayLeds.slice(1).map(([u, v]) => (
                <circle
                  key={`${u}-${v}`}
                  className="rw-led"
                  data-on="false"
                  cx={u}
                  cy={v}
                  r={0.8}
                />
              ))}
            </g>
          </g>
        </IsoFigure>
      </div>
    </>
  );
}
