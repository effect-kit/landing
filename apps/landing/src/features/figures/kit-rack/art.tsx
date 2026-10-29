import * as React from "react";

import { Dots, FaceText, Line, Solid } from "@/components/iso/react/draw";

import {
  BLANK_ART,
  CABLES,
  CABLE_WIDTH,
  CASE_ART,
  PANEL_ART,
  PLUGS,
  PROGRAM_ART,
  SELECTOR_ART,
} from "./geometry";
import { KitRackLive } from "./live";
import type { Selector } from "./model";

const panelOf = (key: string) => {
  const panel = PANEL_ART.find((each) => each.key === key);
  if (!panel) throw new Error(`No panel ${key}`);
  return panel;
};

function Panel({ module }: { module: string }) {
  const panel = panelOf(module);
  return (
    <>
      <Solid paths={panel.slab} tone="mid" crease="faint" />
      {panel.screws.map((screw) => (
        <Solid
          key={screw.key}
          paths={screw.head}
          tone="mid"
          crease="none"
          inner={<Line d={screw.slot} tone="lo" />}
        />
      ))}
    </>
  );
}

const CASE_BACK = (
  <g key="case-back">
    <path className="iso-halo" d={CASE_ART.halo} />
    {CASE_ART.feet.map((foot) => (
      <g key={foot.key}>
        <Solid paths={foot.flange} tone="lo" crease="faint" />
        <Solid paths={foot.foot} tone="lo" crease="faint" />
      </g>
    ))}
    <Solid
      paths={CASE_ART.leftCheek}
      tone="mid"
      crease="faint"
      inner={<Line d={CASE_ART.leftCheekTop} tone="faint" />}
    />
    <Solid
      paths={CASE_ART.tub}
      tone="lo"
      crease="faint"
      inner={<Line d={CASE_ART.tubSeam} tone="faint" />}
    />
    {CASE_ART.rails.map((rail) => (
      <Solid key={rail.key} paths={rail.paths} tone="mid" crease="faint" />
    ))}
    <Line d={CASE_ART.holes} tone="lo" />
  </g>
);

const PROGRAM = (
  <g key="program">
    <Panel module="program" />
    <Line d={PROGRAM_ART.rule} tone="faint" />
    <Solid paths={PROGRAM_ART.bezel} tone="mid" crease="faint" />
    <path className="kr-window" d={PROGRAM_ART.window} />
    <Line d={PROGRAM_ART.windowEdge} tone="lo" />
    <Line d={PROGRAM_ART.code} tone="mid" free />
    <FaceText transform={PROGRAM_ART.label} size={3.4} tone="lo" anchor="middle">
      yield*
    </FaceText>
    {PROGRAM_ART.nuts.map((nut) => (
      <Solid
        key={nut.key}
        paths={nut.body}
        tone="mid"
        crease="faint"
        inner={<Line d={nut.face} tone="faint" />}
      />
    ))}
  </g>
);

function selectorParts(selector: Selector) {
  const art = SELECTOR_ART[selector];
  return {
    base: (
      <g key={`${selector}-base`}>
        <Panel module={selector} />
        <Line d={art.arc} tone="lo" />
        <Dots points={art.stopDots} size={0.55} tone="mid" />
        <Solid
          paths={art.nut.body}
          tone="mid"
          crease="faint"
          inner={<Line d={art.nut.face} tone="faint" />}
        />
        <Solid paths={art.ledBezel} tone="mid" crease="faint" />
        <Solid paths={art.lens} tone="hi" crease="faint" />
      </g>
    ),
    skirt: (
      <g key={`${selector}-skirt`}>
        <Solid
          paths={art.skirt}
          tone="mid"
          crease="faint"
          inner={<Line d={art.skirtBand} tone="faint" />}
        />
      </g>
    ),
    knob: (
      <g key={`${selector}-knob`}>
        <Solid paths={art.knob} tone="hi" crease="lo" inner={<Line d={art.knurl} tone="lo" />} />
        <Solid
          paths={art.cap}
          tone="hi"
          crease="lo"
          inner={<Line d={art.capRing} tone="faint" />}
        />
      </g>
    ),
  };
}

const REDIS = selectorParts("redis");
const EMAILS = selectorParts("emails");

const BLANK = (
  <g key="blank">
    <Panel module="blank" />
    <Line d={BLANK_ART.vents} tone="lo" />
  </g>
);

const CASE_FRONT = (
  <g key="case-front">
    <Solid
      paths={CASE_ART.rightCheek}
      tone="mid"
      crease="faint"
      inner={<Line d={CASE_ART.rightCheekTop} tone="faint" />}
    />
    <Dots points={CASE_ART.cheekScrews} size={0.55} tone="mid" />
    <Solid paths={CASE_ART.socket} tone="mid" crease="faint" />
    <Line d={CASE_ART.socketRings} tone="lo" />
    <Dots points={[CASE_ART.socketPin]} size={0.5} tone="hi" />
  </g>
);

const PLUG_ART = (
  <g key="plugs">
    {PLUGS.map((plug) => (
      <g key={plug.x}>
        <Solid paths={plug.barrel} tone="mid" crease="faint" />
        <Solid
          paths={plug.sleeve}
          tone="mid"
          crease="faint"
          inner={<Line d={plug.knurl} tone="lo" />}
        />
        <Solid
          paths={plug.boot}
          tone="mid"
          crease="faint"
          inner={<Line d={plug.bootRing} tone="faint" />}
        />
      </g>
    ))}
  </g>
);

const CABLE_ART = (
  <g key="cables">
    {(["redis", "emails"] as const).map((selector) => (
      <g key={selector}>
        <path
          className="kr-cable kr-cable-edge"
          d={CABLES[selector].d}
          strokeWidth={CABLE_WIDTH + 1.2}
        />
        <path className="kr-cable kr-cable-core" d={CABLES[selector].d} strokeWidth={CABLE_WIDTH} />
        <path
          className="kr-cable kr-cable-shine"
          d={CABLES[selector].d}
          strokeWidth={Math.round(CABLE_WIDTH * 3) / 10}
          transform={`translate(0 ${-Math.round(CABLE_WIDTH * 2) / 10})`}
        />
      </g>
    ))}
  </g>
);

const LABEL =
  "A flat instrument case with four modules. A program module with a code window and two output jacks is patched by two cables to a Redis module and an Emails module. Each has a selector knob whose positions are that package's Layers: three for Redis, sixteen for Emails. The fourth slot, reserved for Storage, holds a blank cover panel. Turning a knob changes the Layer; the program module and its cables stay as they are.";

export function KitRackArt() {
  return (
    <KitRackLive
      label={LABEL}
      caseBack={CASE_BACK}
      program={PROGRAM}
      base={{ redis: REDIS.base, emails: EMAILS.base }}
      skirt={{ redis: REDIS.skirt, emails: EMAILS.skirt }}
      knob={{ redis: REDIS.knob, emails: EMAILS.knob }}
      detents={{ redis: SELECTOR_ART.redis.detents, emails: SELECTOR_ART.emails.detents }}
      lens={{ redis: SELECTOR_ART.redis.lensTop, emails: SELECTOR_ART.emails.lensTop }}
      glow={{ redis: SELECTOR_ART.redis.glow, emails: SELECTOR_ART.emails.glow }}
      blank={BLANK}
      caseFront={CASE_FRONT}
      plugs={PLUG_ART}
      cables={CABLE_ART}
      routes={{ redis: CABLES.redis.points, emails: CABLES.emails.points }}
    />
  );
}
