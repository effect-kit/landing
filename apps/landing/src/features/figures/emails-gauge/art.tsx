import { Dots, FaceText, Line, Solid } from "@/components/iso/react/draw";

import {
  BASE_ART,
  BLADE_ART,
  COUNTER_ART,
  DIAL_ART,
  FEELER_ART,
  FLAG_ART,
  GATE_ART,
  NAME_ART,
  OUT_ART,
  ROLLER_ART,
  TRAY_ART,
} from "./geometry";
import { EmailsGaugeLive } from "./live";

const BASE = (
  <g key="base">
    <path className="iso-halo" d={BASE_ART.halo} />
    {BASE_ART.feet.map(([flange, foot]) => (
      <g key={flange.outline}>
        <Solid paths={flange} tone="lo" crease="faint" />
        <Solid paths={foot} tone="mid" crease="faint" />
      </g>
    ))}
    <Solid
      paths={BASE_ART.slab}
      tone="mid"
      crease="faint"
      inner={<Line d={BASE_ART.seam} tone="faint" />}
    />
    <Line d={BASE_ART.groove} tone="lo" />
    <Line d={BASE_ART.screwRings} tone="lo" />
    <Dots points={BASE_ART.screws} size={0.5} tone="mid" />
    <Solid paths={NAME_ART.plate} tone="lo" crease="none" />
    <Line d={NAME_ART.inset} tone="faint" />
    <Dots points={NAME_ART.screws} size={0.45} tone="mid" />
    <FaceText transform={NAME_ART.label} size={3.4} tone="lo" anchor="middle">
      Email.send
    </FaceText>
  </g>
);

const OUT_BACK = (
  <g key="out-back">
    <path className="iso-halo" d={OUT_ART.halo} />
    <Solid paths={OUT_ART.floor} tone="lo" crease="faint" />
    <Line d={OUT_ART.ribs} tone="faint" />
    <Dots points={OUT_ART.ribEnds} size={0.4} tone="mid" />
    <Solid paths={OUT_ART.back} tone="mid" crease="faint" />
    <Dots points={OUT_ART.backScrews} size={0.4} tone="mid" />
  </g>
);

const TRAY_BACK = (
  <g key="tray-back">
    <path className="iso-halo" d={TRAY_ART.halo} />
    <Solid
      paths={TRAY_ART.body}
      tone="mid"
      crease="faint"
      inner={<Line d={TRAY_ART.seam} tone="faint" />}
    />
    <Line d={TRAY_ART.well} tone="faint" />
    <Solid paths={TRAY_ART.back} tone="mid" crease="faint" />
    <Dots points={TRAY_ART.guideScrews} size={0.4} tone="mid" />
    <Solid paths={TRAY_ART.fence} tone="mid" crease="faint" />
    <Dots points={TRAY_ART.fenceScrews} size={0.4} tone="mid" />
  </g>
);

const ROLLERS_BACK = (
  <g key="rollers-back">
    <Solid paths={ROLLER_ART.backCheek} tone="mid" crease="faint" />
    <Dots points={ROLLER_ART.backScrews} size={0.4} tone="mid" />
    {ROLLER_ART.rollers.map((paths) => (
      <Solid key={paths.outline} paths={paths} tone="mid" crease="none" />
    ))}
  </g>
);

const GATE_BACK = (
  <g key="gate-back">
    <path className="iso-halo" d={GATE_ART.bedHalo} />
    <path className="iso-halo" d={GATE_ART.postHalo} />
    <Solid
      paths={GATE_ART.bed}
      tone="mid"
      crease="faint"
      inner={<Line d={GATE_ART.bedSeam} tone="faint" />}
    />
    <Line d={GATE_ART.anvil} tone="lo" />
    <Dots points={GATE_ART.bedScrews} size={0.45} tone="mid" />
    <Solid paths={GATE_ART.foot} tone="lo" crease="faint" />
    <Dots points={GATE_ART.footScrews} size={0.4} tone="mid" />
    <Solid
      paths={GATE_ART.post}
      tone="mid"
      crease="faint"
      inner={<Line d={GATE_ART.postSeam} tone="faint" />}
    />
    <Line d={GATE_ART.slot} tone="lo" />
    <Line d={GATE_ART.ticksMinor} tone="lo" />
    <Line d={GATE_ART.ticksMajor} tone="mid" />
    <Solid paths={GATE_ART.knee} tone="mid" crease="faint" />
    <Dots points={GATE_ART.kneeScrews} size={0.4} tone="mid" />
  </g>
);

const BLADE = (
  <g key="blade">
    <Solid
      paths={BLADE_ART.blade}
      tone="mid"
      crease="faint"
      inner={<Line d={BLADE_ART.edge} tone="lo" />}
    >
      <Line d={BLADE_ART.ribs} tone="faint" />
    </Solid>
    {BLADE_ART.rods.map((paths) => (
      <Solid key={paths.outline} paths={paths} tone="mid" crease="none" />
    ))}
    {BLADE_ART.rodCollars.map((paths) => (
      <Solid key={paths.outline} paths={paths} tone="mid" crease="faint" />
    ))}
  </g>
);

const TRAY_FRONT = (
  <g key="tray-front">
    <Solid paths={TRAY_ART.front} tone="mid" crease="faint" />
    <Dots points={TRAY_ART.frontScrews} size={0.4} tone="mid" />
  </g>
);

const CHEEK_FRONT = (
  <g key="cheek-front">
    <Solid
      paths={ROLLER_ART.frontCheek}
      tone="mid"
      crease="faint"
      inner={<Line d={ROLLER_ART.frontSeam} tone="faint" />}
    />
    <Dots points={ROLLER_ART.frontScrews} size={0.45} tone="mid" />
    {ROLLER_ART.caps.map((paths) => (
      <Solid key={paths.outline} paths={paths} tone="mid" crease="lo" />
    ))}
  </g>
);

const CAP_HUBS = <Dots key="hubs" points={ROLLER_ART.capHubs} size={0.5} tone="hi" />;

const FEELER = (
  <g key="feeler">
    <Solid paths={FEELER_ART.arm} tone="mid" crease="faint" />
    <Solid paths={FEELER_ART.wheel} tone="mid" crease="lo" />
    <Dots points={FEELER_ART.axle} size={0.5} tone="hi" />
  </g>
);

const OUT_FRONT = (
  <g key="out-front">
    <Solid paths={OUT_ART.end} tone="mid" crease="faint" />
    <Solid paths={OUT_ART.front} tone="mid" crease="faint" />
    <Dots points={OUT_ART.frontScrews} size={0.4} tone="mid" />
  </g>
);

const PIN = <Solid key="pin" paths={BLADE_ART.pin} tone="hi" crease="lo" />;

const BRIDGE = (
  <g key="bridge">
    <Solid
      paths={GATE_ART.bridge}
      tone="mid"
      crease="faint"
      inner={<Line d={GATE_ART.bridgeSeam} tone="faint" />}
    />
    <Line d={GATE_ART.bridgeRings} tone="lo" />
    <Dots points={GATE_ART.bridgeScrews} size={0.45} tone="mid" />
    <Solid paths={FLAG_ART.stop} tone="lo" crease="none" />
    <Solid paths={FLAG_ART.lugBack} tone="mid" crease="faint" />
  </g>
);

const FLAG_FRONT = (
  <g key="flag-front">
    <Solid paths={FLAG_ART.lugFront} tone="mid" crease="faint" />
    <Solid paths={FLAG_ART.pin} tone="mid" crease="lo" />
  </g>
);

const DIAL = (
  <g key="dial">
    <Solid
      paths={DIAL_ART.plate}
      tone="mid"
      crease="faint"
      inner={<Line d={DIAL_ART.plateSeam} tone="faint" />}
    />
    <Line d={DIAL_ART.bezel} tone="lo" />
    <Line d={DIAL_ART.detents} tone="mid" />
    <Solid paths={DIAL_ART.skirt} tone="mid" crease="faint" />
  </g>
);

const KNOB = (
  <g key="knob">
    <Solid
      paths={DIAL_ART.knob}
      tone="hi"
      crease="faint"
      inner={<Line d={DIAL_ART.knurlSeams} tone="faint" />}
    >
      <Line d={DIAL_ART.knurl} tone="lo" />
    </Solid>
  </g>
);

const HUB = <Line key="hub" d={DIAL_ART.hub} tone="lo" />;

const COUNTER = (
  <g key="counter">
    <path className="iso-halo" d={COUNTER_ART.halo} />
    <Solid
      paths={COUNTER_ART.case}
      tone="mid"
      crease="faint"
      inner={
        <>
          <Line d={COUNTER_ART.seam} tone="faint" />
          <Line d={COUNTER_ART.lid} tone="faint" />
        </>
      }
    />
    <path className="eg-recess" d={COUNTER_ART.windowBack} />
    <path className="iso-shade" data-shade="0" d={COUNTER_ART.recessTop} />
    <path className="iso-shade" data-shade="1" d={COUNTER_ART.recessSide} />
    <Dots points={COUNTER_ART.screws} size={0.45} tone="mid" />
    <Solid paths={COUNTER_ART.resetStem} tone="mid" crease="none" />
    <Solid paths={COUNTER_ART.reset} tone="mid" crease="faint">
      <Line d={COUNTER_ART.resetKnurl} tone="lo" />
    </Solid>
  </g>
);

const COUNTER_GLASS = (
  <g key="counter-glass">
    <Line d={COUNTER_ART.dividers} tone="lo" />
    <Line d={COUNTER_ART.windowBack} tone="faint" />
    <Line d={COUNTER_ART.window} tone="lo" />
  </g>
);

const LABEL =
  "A mail franking bench. A letter waits on a feed tray, rollers carry it to a gate whose blade height is set by a five-position dial on the bridge, one position per email adapter. Past the gate a feeler wheel trips a request counter and the letter drops into an out tray. With an attachment the letter is a thick packet with a paper clip: adapters that declare attachments open the gate wide and it goes through; adapters that don't keep the gate low, the packet stops, backs off, a reject flag stands up on the bridge and the counter stays at zero.";

export function EmailsGaugeArt() {
  return (
    <EmailsGaugeLive
      label={LABEL}
      base={BASE}
      outBack={OUT_BACK}
      trayBack={TRAY_BACK}
      rollersBack={ROLLERS_BACK}
      gateBack={GATE_BACK}
      blade={BLADE}
      trayFront={TRAY_FRONT}
      cheekFront={CHEEK_FRONT}
      capHubs={CAP_HUBS}
      feeler={FEELER}
      outFront={OUT_FRONT}
      pin={PIN}
      bridge={BRIDGE}
      flagFront={FLAG_FRONT}
      dial={DIAL}
      knob={KNOB}
      hub={HUB}
      counter={COUNTER}
      counterGlass={COUNTER_GLASS}
    />
  );
}
