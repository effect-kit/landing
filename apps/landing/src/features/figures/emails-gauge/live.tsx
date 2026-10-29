"use client";

import * as React from "react";

import { translateAlong, type SolidPaths } from "@/components/iso/iso-kit";
import { IsoFigure } from "@/components/iso/react/draw";
import { asksForStillness, useReadout } from "@/components/iso/react/live";
import { track } from "@/lib/analytics/client";

import { begin, settledSim, step, type Sim } from "./bench";
import { flagOf, letterOf, marksOf, pointerOf } from "./frame";
import { COUNTER_ART } from "./geometry";
import { readoutOf, REST_SETUP, spokenOf, STATIONS, stationAt, TOUR, type Setup } from "./model";
import { at, DIAL, HEIGHT, KNOB_TOP, P, WIDTH } from "./view";

const TOUR_FIRST = 1400;
const TOUR_BACK = 3600;
const HOLD = 2.6;
const MOST_DT = 1 / 30;

/* ---------- Pose to attributes ---------- */

const letterAt = (sim: Sim) => translateAlong(P, [sim.x.at, 0, sim.z]);
const bladeAt = (sim: Sim) => translateAlong(P, [0, 0, sim.blade.at]);
const liftAt = (sim: Sim) => translateAlong(P, [0, 0, sim.lift]);
const CELL_H = COUNTER_ART.cellHeight;
const DIGIT_BASELINE = CELL_H / 2 + 1.6;
const digitAt = (sim: Sim) => `translate(0 ${-Math.round(sim.digit * CELL_H * 100) / 100})`;
const percent = (value: number, of: number) => `${Math.round((value / of) * 10000) / 100}%`;
const letterSpot = (sim: Sim) => at([sim.x.at, 0, sim.z + sim.h]);
const DIAL_SPOT = at([DIAL[0], DIAL[1], KNOB_TOP]);

const REST = settledSim(REST_SETUP);
const REST_LETTER = letterOf(REST.h);
const REST_FLAG = flagOf(REST.flag.at);
const REST_POINTER = pointerOf(REST.dial.at);
const REST_MARKS = marksOf(REST.roll);
const REST_SPOT = letterSpot(REST);

/* A solid whose paths are rewritten live: the same layers `Solid` draws, found by class. */
function LiveSolid({
  name,
  paths,
  tone,
  crease,
  className,
  children,
}: {
  name: string;
  paths: SolidPaths;
  tone: "hi" | "mid";
  crease: "faint" | "lo";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <g className={className ? `iso-solid ${className}` : "iso-solid"} data-live={name}>
      <path className="iso-fill" d={paths.fill} />
      {paths.shades.map((d, shade) => (
        <path key={`shade-${String(shade)}`} className="iso-shade" data-shade={shade} d={d} />
      ))}
      <path className="iso-top" d={paths.top} />
      <path className="iso-line iso-crease" data-tone={crease} d={paths.crease} />
      <path className="iso-line iso-bevel" data-tone={crease} d={paths.bevel ?? ""} />
      {children}
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
    </g>
  );
}

function writeSolid(group: Element | null, paths: SolidPaths) {
  if (!group) return;
  group.querySelector(":scope > .iso-fill")?.setAttribute("d", paths.fill);
  group
    .querySelectorAll(":scope > .iso-shade")
    .forEach((node, shade) => node.setAttribute("d", paths.shades[shade] ?? ""));
  group.querySelector(":scope > .iso-top")?.setAttribute("d", paths.top);
  group.querySelector(":scope > .iso-crease")?.setAttribute("d", paths.crease);
  group.querySelector(":scope > .iso-bevel")?.setAttribute("d", paths.bevel ?? "");
  group.querySelector(":scope > .iso-edge")?.setAttribute("d", paths.outline);
}

interface Nodes {
  letter: SVGGElement | null;
  body: Element | null;
  stamp: Element | null;
  address: Element | null;
  clip: SVGElement | null;
  blade: Element | null;
  pin: Element | null;
  feeler: Element | null;
  marks: Element | null;
  pointer: Element | null;
  index: Element | null;
  mast: Element | null;
  plate: Element | null;
  digit: Element | null;
  letterButton: HTMLElement | null;
}

function collect(root: HTMLElement): Nodes {
  const find = <T extends Element>(name: string) => root.querySelector<T>(`[data-live="${name}"]`);
  return {
    letter: find<SVGGElement>("letter"),
    body: find("body"),
    stamp: find("stamp"),
    address: find("address"),
    clip: find<SVGElement>("clip"),
    blade: find("blade"),
    pin: find("pin"),
    feeler: find("feeler"),
    marks: find("marks"),
    pointer: find("pointer"),
    index: find("index"),
    mast: find("mast"),
    plate: find("plate"),
    digit: find("digit"),
    letterButton: find<HTMLElement>("letter-button"),
  };
}

const opacityOf = (value: number) => (value < 1 ? `${Math.round(value * 100) / 100}` : "");

/* ---------- Component ---------- */

interface Props {
  label: string;
  base: React.ReactNode;
  outBack: React.ReactNode;
  trayBack: React.ReactNode;
  rollersBack: React.ReactNode;
  gateBack: React.ReactNode;
  blade: React.ReactNode;
  trayFront: React.ReactNode;
  cheekFront: React.ReactNode;
  capHubs: React.ReactNode;
  feeler: React.ReactNode;
  outFront: React.ReactNode;
  pin: React.ReactNode;
  bridge: React.ReactNode;
  flagFront: React.ReactNode;
  dial: React.ReactNode;
  knob: React.ReactNode;
  hub: React.ReactNode;
  counter: React.ReactNode;
  counterGlass: React.ReactNode;
}

export function EmailsGaugeLive(props: Props) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const clipId = `${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}-digit`;
  const nodes = React.useRef<Nodes | null>(null);
  const sim = React.useRef<Sim>(settledSim(REST_SETUP));
  const drawn = React.useRef({ h: REST.h, flag: REST.flag.at, dial: REST.dial.at });
  const frame = React.useRef(0);
  const last = React.useRef(0);
  const touring = React.useRef(false);
  const tourAt = React.useRef(0);
  const asked = React.useRef(false);
  const engaged = React.useRef({ hover: false, focus: false });
  const idleTimer = React.useRef(0);
  const [setup, setSetup] = React.useState<Setup>(REST_SETUP);
  const [spoken, setSpoken] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const [idle, setIdle] = React.useState(true);

  const draw = React.useCallback(() => {
    const n = nodes.current;
    if (!n) return;
    const now = sim.current;
    const seen = drawn.current;
    if (Math.abs(seen.h - now.h) > 0.004) {
      const letter = letterOf(now.h);
      writeSolid(n.body, letter.body);
      n.stamp?.setAttribute("d", letter.stamp);
      n.address?.setAttribute("d", letter.address);
      n.clip?.setAttribute("d", letter.clip);
      seen.h = now.h;
    }
    if (n.letter) {
      n.letter.setAttribute("transform", letterAt(now));
      n.letter.style.opacity = opacityOf(now.fade);
    }
    if (n.clip) n.clip.style.opacity = opacityOf(now.clip);
    n.blade?.setAttribute("transform", bladeAt(now));
    n.pin?.setAttribute("transform", bladeAt(now));
    n.feeler?.setAttribute("transform", liftAt(now));
    n.marks?.setAttribute("d", marksOf(now.roll));
    if (Math.abs(seen.dial - now.dial.at) > 1e-4) {
      const pointer = pointerOf(now.dial.at);
      writeSolid(n.pointer, pointer.tab);
      n.index?.setAttribute("d", pointer.index);
      seen.dial = now.dial.at;
    }
    if (Math.abs(seen.flag - now.flag.at) > 1e-4) {
      const flag = flagOf(now.flag.at);
      writeSolid(n.mast, flag.mast);
      writeSolid(n.plate, flag.plate);
      seen.flag = now.flag.at;
    }
    n.digit?.setAttribute("transform", digitAt(now));
    if (n.letterButton) {
      const [sx, sy] = letterSpot(now);
      n.letterButton.style.left = percent(sx, WIDTH);
      n.letterButton.style.top = percent(sy, HEIGHT);
    }
    say(readoutOf(now.setup, now.decided));
  }, [say]);

  const stop = React.useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, []);

  const run = React.useCallback(() => {
    if (frame.current) return;
    last.current = 0;
    const tick = (time: number) => {
      const dt = last.current ? Math.min((time - last.current) / 1000, MOST_DT) : 1 / 60;
      last.current = time;
      const now = sim.current;
      if (asksForStillness()) {
        sim.current = { ...settledSim(now.setup), roll: now.roll };
        drawn.current = { h: -1, flag: -1, dial: -1 };
        draw();
        if (asked.current) {
          asked.current = false;
          setSpoken(spokenOf(now.setup));
        }
        frame.current = 0;
        return;
      }
      const wasDecided = now.decided;
      const moving = step(now, dt);
      if (!wasDecided && now.decided && asked.current) {
        asked.current = false;
        setSpoken(spokenOf(now.setup));
      }
      draw();
      if (!moving && touring.current) {
        now.held += dt;
        if (now.held >= HOLD) {
          tourAt.current = (tourAt.current + 1) % TOUR.length;
          const next = TOUR[tourAt.current] ?? REST_SETUP;
          setSetup(next);
          begin(now, next);
        }
      }
      frame.current = moving || touring.current ? requestAnimationFrame(tick) : 0;
    };
    frame.current = requestAnimationFrame(tick);
  }, [draw]);

  React.useEffect(() => {
    const node = anchor.current;
    if (!node) return undefined;
    nodes.current = collect(node);
    const observer = new IntersectionObserver((entries) =>
      setVisible(Boolean(entries.at(-1)?.isIntersecting)),
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
      window.clearTimeout(idleTimer.current);
    };
  }, [anchor, stop]);

  React.useEffect(() => {
    if (!visible) {
      touring.current = false;
      stop();
      return undefined;
    }
    if (!idle || asksForStillness()) {
      touring.current = false;
      run();
      return undefined;
    }
    const timer = window.setTimeout(() => {
      touring.current = true;
      const next = TOUR[tourAt.current] ?? REST_SETUP;
      setSetup(next);
      begin(sim.current, next);
      run();
    }, TOUR_FIRST);
    return () => {
      window.clearTimeout(timer);
      touring.current = false;
    };
  }, [visible, idle, run, stop]);

  /* Someone is here: hold the tour. When they leave, start it again after a quiet spell. */
  const hold = () => {
    window.clearTimeout(idleTimer.current);
    setIdle(false);
  };
  const release = () => {
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      if (!engaged.current.hover && !engaged.current.focus) setIdle(true);
    }, TOUR_BACK);
  };

  const choose = (next: Setup) => {
    touring.current = false;
    hold();
    if (!engaged.current.hover && !engaged.current.focus) release();
    asked.current = true;
    setSetup(next);
    begin(sim.current, next);
    run();
  };
  const turn = (by: number) => {
    const station = (setup.station + by + STATIONS.length) % STATIONS.length;
    track("figure_interacted", {
      figure: "emails_gauge",
      action: "dial_turned",
      value: stationAt(station).name,
    });
    choose({ ...setup, station });
  };
  const toggle = () => {
    track("figure_interacted", {
      figure: "emails_gauge",
      action: "attachment_toggled",
      value: !setup.attached,
    });
    choose({ ...setup, attached: !setup.attached });
  };

  const station = stationAt(setup.station);

  return (
    <div
      ref={anchor}
      className="eg-stage"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        engaged.current.hover = true;
        hold();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        engaged.current.hover = false;
        release();
      }}
      onFocus={() => {
        engaged.current.focus = true;
        hold();
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        engaged.current.focus = false;
        release();
      }}
    >
      <IsoFigure width={WIDTH} height={HEIGHT} label={props.label}>
        {props.base}
        {props.outBack}
        {props.trayBack}
        {props.rollersBack}
        {props.gateBack}
        <g data-live="pin" transform={bladeAt(REST)}>
          {props.pin}
        </g>
        <g data-live="letter" transform={letterAt(REST)}>
          <path className="iso-halo eg-letter-halo" d={REST_LETTER.body.fill} />
          <LiveSolid
            name="body"
            paths={REST_LETTER.body}
            tone="hi"
            crease="faint"
            className="eg-letter"
          >
            <path data-live="stamp" className="iso-line eg-letter-ink" d={REST_LETTER.stamp} />
            <path
              data-live="address"
              className="iso-line eg-letter-ink"
              data-free=""
              d={REST_LETTER.address}
            />
          </LiveSolid>
          <path
            data-live="clip"
            className="iso-line eg-clip"
            data-tone="hi"
            d={REST_LETTER.clip}
            style={REST.clip < 1 ? { opacity: REST.clip } : undefined}
          />
        </g>
        <g data-live="blade" transform={bladeAt(REST)}>
          {props.blade}
        </g>
        {props.trayFront}
        {props.cheekFront}
        <path data-live="marks" className="iso-line" data-tone="hi" d={REST_MARKS} />
        {props.capHubs}
        <g data-live="feeler" transform={liftAt(REST)}>
          {props.feeler}
        </g>
        {props.outFront}
        {props.bridge}
        <LiveSolid name="mast" paths={REST_FLAG.mast} tone="mid" crease="faint" />
        <LiveSolid name="plate" paths={REST_FLAG.plate} tone="hi" crease="lo" />
        {props.flagFront}
        {props.dial}
        <LiveSolid name="pointer" paths={REST_POINTER.tab} tone="hi" crease="lo" />
        {props.knob}
        <path data-live="index" className="iso-line" data-tone="lit" d={REST_POINTER.index} />
        {props.hub}
        {props.counter}
        <defs>
          <clipPath id={clipId}>
            <path d={COUNTER_ART.clip} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <g transform={COUNTER_ART.cells[0]}>
            <text className="iso-face-text eg-digit" x={0} y={DIGIT_BASELINE} textAnchor="middle">
              0
            </text>
          </g>
          <g transform={COUNTER_ART.cells[1]}>
            <text className="iso-face-text eg-digit" x={0} y={DIGIT_BASELINE} textAnchor="middle">
              0
            </text>
          </g>
          <g transform={COUNTER_ART.cells[2]}>
            <g data-live="digit" transform={digitAt(REST)}>
              <text className="iso-face-text eg-digit" x={0} y={DIGIT_BASELINE} textAnchor="middle">
                0
              </text>
              <text
                className="iso-face-text eg-digit"
                x={0}
                y={DIGIT_BASELINE + CELL_H}
                textAnchor="middle"
              >
                1
              </text>
            </g>
          </g>
        </g>
        {props.counterGlass}
      </IsoFigure>
      <button
        type="button"
        className="eg-hit eg-hit-dial"
        style={{ left: percent(DIAL_SPOT[0], WIDTH), top: percent(DIAL_SPOT[1], HEIGHT) }}
        aria-label={`Provider dial, set to ${station.name}. Turn to the next provider`}
        aria-keyshortcuts="ArrowLeft ArrowRight"
        onClick={() => turn(1)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            turn(1);
          } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            turn(-1);
          }
        }}
      />
      <button
        data-live="letter-button"
        type="button"
        className="eg-hit eg-hit-letter"
        style={{ left: percent(REST_SPOT[0], WIDTH), top: percent(REST_SPOT[1], HEIGHT) }}
        aria-pressed={setup.attached}
        aria-label="Attachment on the letter"
        onClick={toggle}
      />
      <span className="sr-only" aria-live="polite">
        {spoken}
      </span>
    </div>
  );
}
