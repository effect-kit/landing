import { Dots, FaceText, Line, Solid } from "@/components/iso/react/draw";

import {
  BENCH_ART,
  CLIENT_ART,
  COUNTER,
  INSULATOR_ART,
  RETURN_ART,
  RODS,
  SERVER_ART,
  SWITCH_ART,
  TRAY_ART,
  WHEEL_PITCH,
  WHEEL_W,
} from "./geometry";

const BENCH = (
  <g key="bench">
    <path className="iso-halo" d={BENCH_ART.halo} />
    {BENCH_ART.feet.map((parts, index) => (
      <g key={index}>
        {parts.map((paths, part) => (
          <Solid key={part} paths={paths} tone={part ? "mid" : "lo"} crease="faint" />
        ))}
      </g>
    ))}
    <Solid
      paths={BENCH_ART.slab}
      tone="mid"
      crease="faint"
      inner={<Line d={BENCH_ART.seam} tone="faint" />}
    />
    <Line d={BENCH_ART.groove} tone="lo" />
    <Line d={BENCH_ART.screwRings} tone="lo" />
    <Dots points={BENCH_ART.screws} size={0.5} tone="mid" />
    <Solid paths={BENCH_ART.label} tone="lo" crease="none" />
    <Line d={BENCH_ART.labelLine} tone="faint" />
    <Line d={BENCH_ART.labelRule} tone="lo" free />
    <Dots points={BENCH_ART.labelScrews} size={0.45} tone="mid" />
  </g>
);

const CLIENT = (
  <g key="client">
    <path className="iso-halo" d={CLIENT_ART.halo} />
    <Solid paths={CLIENT_ART.plinth} tone="lo" crease="faint" />
    <Solid
      paths={CLIENT_ART.body}
      tone="mid"
      crease="faint"
      inner={<Line d={CLIENT_ART.seam} tone="faint" />}
    />
    <Line d={CLIENT_ART.vents} tone="lo" />
    <Dots points={CLIENT_ART.topScrews} size={0.5} tone="mid" />
    <Line d={CLIENT_ART.keypadWell} tone="faint" />
    {CLIENT_ART.keys.map((paths, index) => (
      <Solid key={index} paths={paths} tone="mid" crease="faint" />
    ))}
    <Line d={CLIENT_ART.knobTicks} tone="lo" />
    <Solid paths={CLIENT_ART.knobCollar} tone="lo" crease="faint" />
    <Solid paths={CLIENT_ART.knob} tone="mid" crease="faint" />
    <Line d={CLIENT_ART.knobKnurl} tone="faint" />
    <Line d={CLIENT_ART.knobFace} tone="faint" />
    <Line d={CLIENT_ART.knobPointer} tone="hi" />
    <g transform={CLIENT_ART.frontPlane}>
      <path className="iso-line" data-tone="lo" d={CLIENT_ART.bezel} />
      <path className="iso-line" data-tone="lo" d={CLIENT_ART.ledRings} />
      <path className="iso-line" data-tone="faint" d={CLIENT_ART.frontVents} />
      <g className="iso-dots" data-tone="mid">
        {CLIENT_ART.frontScrews.map(([u, v], index) => (
          <circle key={index} cx={u} cy={v} r={0.55} />
        ))}
      </g>
    </g>
    <Line d={CLIENT_ART.port} tone="lo" />
    <Line d={CLIENT_ART.sideVents} tone="faint" />
    <Dots points={CLIENT_ART.portScrews} size={0.5} tone="mid" />
  </g>
);

/** The screen sits 1.6 back from the face: its floor and left wall show, the rest is clipped. */
const SCREEN_CLIP = (
  <clipPath key="screen-clip" id="rw-screen">
    <path d={CLIENT_ART.screen.opening} />
  </clipPath>
);

const SCREEN_BACK = (
  <g key="screen-back" clipPath="url(#rw-screen)">
    <path className="rw-screen" d={CLIENT_ART.screen.back} />
    <path className="iso-top" d={CLIENT_ART.screen.floor} />
    <path className="iso-shade" data-shade="1" d={CLIENT_ART.screen.wall} />
    <path className="iso-line" data-tone="faint" d={CLIENT_ART.screen.inner} />
  </g>
);

const SCREEN_RIM = <Line key="screen-rim" d={CLIENT_ART.screen.rim} tone="mid" />;

const TRAY_BACK = (
  <g key="tray-back">
    <Solid paths={TRAY_ART.web} tone="mid" crease="faint" />
    <Solid paths={TRAY_ART.floor} tone="mid" crease="faint" />
    <Line d={TRAY_ART.floorLine} tone="faint" />
    <Solid paths={TRAY_ART.backWall} tone="mid" crease="faint" />
    <Solid paths={TRAY_ART.backPost} tone="mid" crease="faint" />
  </g>
);

const TRAY_FRONT = (
  <g key="tray-front">
    <Solid paths={TRAY_ART.frontWall} tone="mid" crease="faint" />
    <Dots points={TRAY_ART.frontRivets} size={0.4} tone="mid" />
    <Solid paths={TRAY_ART.frontPost} tone="mid" crease="faint" />
    <Line d={TRAY_ART.pin} tone="lo" />
    <Dots points={[TRAY_ART.pinDot]} size={0.4} tone="hi" />
    <Solid paths={TRAY_ART.bridge} tone="mid" crease="faint" />
    <Dots points={TRAY_ART.bridgeScrews} size={0.4} tone="mid" />
  </g>
);

type InsulatorKey = keyof typeof INSULATOR_ART;

function insulatorBody(key: InsulatorKey) {
  const art = INSULATOR_ART[key];
  return (
    <g key={`insulator-${key}`}>
      {art.parts.map((paths, part) => (
        <Solid key={part} paths={paths} tone={part === 0 ? "lo" : "mid"} crease="faint" />
      ))}
      <Dots points={art.bolts} size={0.45} tone="mid" />
      <Line d={art.shedLines} tone="faint" />
      <Line d={art.capSeam} tone="faint" />
      <Solid paths={art.backCheek} tone="mid" crease="faint" />
    </g>
  );
}

const insulatorFront = (key: InsulatorKey) => (
  <Solid
    key={`insulator-front-${key}`}
    paths={INSULATOR_ART[key].frontCheek}
    tone="mid"
    crease="faint"
  />
);

const RETURN_A = (
  <g key="return-a">
    <Solid paths={RETURN_ART.block} tone="mid" crease="faint" />
    <Line d={RETURN_ART.nut} tone="lo" />
    <Dots points={RETURN_ART.screws} size={0.45} tone="mid" />
    {insulatorBody("a2")}
    <Solid paths={RODS.a2} tone="mid" crease="none" />
    {insulatorFront("a2")}
  </g>
);

const SWITCH_BASE = (
  <g key="switch-base">
    {insulatorBody("a")}
    <path className="iso-halo" d={SWITCH_ART.riserHalo} />
    <Solid
      paths={SWITCH_ART.riser}
      tone="lo"
      crease="faint"
      inner={<Line d={SWITCH_ART.riserSeam} tone="faint" />}
    />
    <Dots points={SWITCH_ART.riserScrews} size={0.45} tone="mid" />
    <Solid paths={SWITCH_ART.slate} tone="mid" crease="faint" />
    <Line d={SWITCH_ART.slateLine} tone="faint" />
    <Line d={SWITCH_ART.slateScrewRings} tone="lo" />
    <Dots points={SWITCH_ART.slateScrews} size={0.5} tone="mid" />
  </g>
);

type Pole = typeof SWITCH_ART.front;

const poleBase = (pole: Pole, key: string) => (
  <g key={key}>
    <Solid paths={pole.strapA} tone="mid" crease="none" />
    <Solid paths={pole.strapB} tone="mid" crease="none" />
    {[pole.jaw, pole.hinge].map((clip, index) => (
      <g key={index}>
        <Solid paths={clip.foot} tone="mid" crease="faint" />
        <Dots points={clip.footScrews} size={0.4} tone="mid" />
        <Solid paths={clip.back} tone="mid" crease="faint" />
      </g>
    ))}
  </g>
);

const lugArt = (art: Pole["lugA"], key: string) => (
  <g key={key}>
    <Solid paths={art.body} tone="mid" crease="faint" inner={<Line d={art.seam} tone="faint" />} />
    <Solid paths={art.head} tone="mid" crease="faint" />
    <Line d={art.slot} tone="lo" />
  </g>
);

const poleFront = (pole: Pole, key: string) => (
  <g key={key}>
    <Solid paths={pole.jaw.front} tone="mid" crease="faint" />
    <Dots points={[pole.jawRivet]} size={0.5} tone="mid" />
    <Solid paths={pole.hinge.front} tone="mid" crease="faint" />
    <Line d={pole.pin} tone="lo" />
    <Dots points={[pole.pinDot]} size={0.5} tone="hi" />
    {lugArt(pole.lugA, "lug-a")}
    {lugArt(pole.lugB, "lug-b")}
  </g>
);

const BACK_POLE_BASE = poleBase(SWITCH_ART.back, "back-pole-base");

const BACK_POLE_FRONT = (
  <g key="back-pole-front">
    {poleFront(SWITCH_ART.back, "back-pole")}
    {insulatorBody("b2")}
    <Solid paths={RODS.b2} tone="mid" crease="none" />
    {insulatorFront("b2")}
    <Solid paths={SWITCH_ART.barrier} tone="lo" crease="faint" />
  </g>
);

const FRONT_POLE_BASE = (
  <g key="front-pole-base">
    {poleBase(SWITCH_ART.front, "front-pole")}
    <Solid paths={RODS.a} tone="hi" crease="none" />
    {insulatorFront("a")}
  </g>
);

const FRONT_POLE_FRONT = poleFront(SWITCH_ART.front, "front-pole-front");

const LINE_B = (
  <g key="line-b">
    {insulatorBody("b")}
    <Solid paths={RODS.b} tone="hi" crease="none" />
    {insulatorFront("b")}
  </g>
);

const SERVER = (
  <g key="server">
    {SERVER_ART.glands.map((gland, index) => (
      <g key={index}>
        <Solid paths={gland.body} tone="mid" crease="faint" />
        <Solid paths={gland.nut} tone="mid" crease="faint" />
        <Line d={gland.face} tone="lo" />
      </g>
    ))}
    <path className="iso-halo" d={SERVER_ART.halo} />
    <Solid paths={SERVER_ART.plinth} tone="lo" crease="faint" />
    <Solid
      paths={SERVER_ART.body}
      tone="mid"
      crease="faint"
      inner={<Line d={SERVER_ART.seam} tone="faint" />}
    />
    <Line d={SERVER_ART.vents} tone="lo" />
    <Dots points={SERVER_ART.topScrews} size={0.5} tone="mid" />
    <Solid paths={SERVER_ART.nameplate} tone="lo" crease="none" />
    <Line d={SERVER_ART.nameplateLine} tone="faint" />
    <Dots points={SERVER_ART.nameplateScrews} size={0.4} tone="mid" />
    <FaceText transform={SERVER_ART.nameplateText} size={3.4} tone="lo" anchor="middle">
      6379
    </FaceText>
    <g transform={SERVER_ART.frontPlane}>
      <path className="iso-line" data-tone="lo" d={SERVER_ART.counterBezel} />
      <path className="iso-line" data-tone="lo" d={SERVER_ART.ledRings} />
      <path className="iso-line" data-tone="lo" d={SERVER_ART.bays} />
      <path className="iso-line" data-tone="faint" d={SERVER_ART.bayHandles} />
      <path className="iso-line" data-tone="faint" d={SERVER_ART.bayVents} />
      <circle
        className="iso-line"
        data-tone="lo"
        cx={SERVER_ART.counterKnob.u}
        cy={SERVER_ART.counterKnob.v}
        r={2.2}
      />
      <g className="iso-dots" data-tone="mid">
        <circle cx={SERVER_ART.counterKnob.u} cy={SERVER_ART.counterKnob.v} r={0.6} />
        {SERVER_ART.frontScrews.map(([u, v], index) => (
          <circle key={index} cx={u} cy={v} r={0.55} />
        ))}
      </g>
    </g>
    <g transform={SERVER_ART.sidePlane}>
      <path className="iso-line" data-tone="lo" d={SERVER_ART.fanFrame} />
      <path className="iso-line" data-tone="faint" d={SERVER_ART.fan} />
      <path className="iso-line" data-tone="faint" d={SERVER_ART.fanSpokes} />
      <path className="iso-line" data-tone="lo" d={SERVER_ART.inlet} />
      <path className="iso-line" data-tone="lo" d={SERVER_ART.inletPins} />
      <path className="iso-line" data-tone="faint" d={SERVER_ART.sideVents} />
      <g className="iso-dots" data-tone="mid">
        {SERVER_ART.fanScrews.map(([u, v], index) => (
          <circle key={index} cx={u} cy={v} r={0.55} />
        ))}
        <circle cx={22} cy={26} r={0.8} />
      </g>
    </g>
  </g>
);

const COUNTER_CLIP = (
  <clipPath key="counter-clip" id="rw-counter">
    <path d={SERVER_ART.counter.opening} />
  </clipPath>
);

const COUNTER_BACK = (
  <g key="counter-back" clipPath="url(#rw-counter)">
    <path className="rw-screen" d={SERVER_ART.counter.back} />
  </g>
);

/** The counter's wheel dividers and recess walls, drawn over the turning digits. */
const COUNTER_FRONT = (
  <g key="counter-front">
    <g clipPath="url(#rw-counter)">
      <g transform={SERVER_ART.counter.plane}>
        {Array.from({ length: COUNTER.wheels - 1 }, (_, index) => (
          <path
            key={index}
            className="iso-line"
            data-tone="lo"
            d={`M${(index + 1) * WHEEL_W} -2V${COUNTER.z1 - COUNTER.z0 + 2}`}
          />
        ))}
      </g>
      <path className="iso-top" d={SERVER_ART.counter.floor} />
      <path className="iso-shade" data-shade="1" d={SERVER_ART.counter.wall} />
      <path className="iso-line" data-tone="faint" d={SERVER_ART.counter.inner} />
    </g>
    <Line d={SERVER_ART.counter.rim} tone="mid" />
  </g>
);

export const WHEEL_DIGITS = Array.from({ length: 11 }, (_, index) => index % 10);
export { WHEEL_PITCH, WHEEL_W };

export const ART = {
  bench: BENCH,
  client: CLIENT,
  screenClip: SCREEN_CLIP,
  screenBack: SCREEN_BACK,
  screenRim: SCREEN_RIM,
  returnA: RETURN_A,
  trayBack: TRAY_BACK,
  switchBase: SWITCH_BASE,
  backPoleBase: BACK_POLE_BASE,
  backPoleFront: BACK_POLE_FRONT,
  frontPoleBase: FRONT_POLE_BASE,
  trayFront: TRAY_FRONT,
  frontPoleFront: FRONT_POLE_FRONT,
  lineB: LINE_B,
  server: SERVER,
  counterClip: COUNTER_CLIP,
  counterBack: COUNTER_BACK,
  counterFront: COUNTER_FRONT,
};
