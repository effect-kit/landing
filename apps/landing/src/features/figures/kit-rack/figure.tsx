import { Plate } from "@/components/iso/react/draw";
import { cn } from "@/lib/cn";

import { KitRackArt } from "./art";
import { REST, lineOf } from "./model";

/*
 * Scoped styles, hoisted and deduplicated by React so the server render is styled on first paint.
 * Corner labels drop the kit's uppercase tracking; the readout stacks its two lines on the right.
 */
const CSS = `
.kr .iso-figure{margin:0}
.kr .iso-plate-corner[data-corner="title"],.kr .iso-plate-corner[data-corner="hint"]{text-transform:none;letter-spacing:.02em}
.kr .iso-plate-corner[data-corner="readout"]{text-align:right;line-height:1.5}
.kr-line{display:block}
.kr-stage{position:relative}
.kr .kr-cable{fill:none;stroke-linecap:butt;stroke-linejoin:round;vector-effect:none}
.kr-cable-edge{stroke:var(--anatomy-mid)}
.kr-cable-core{stroke:var(--anatomy-shade-1)}
.kr-cable-shine{stroke:var(--anatomy-lo)}
html:not(.dark) .kr .kr-cable-shine{stroke:var(--anatomy-top)}
.kr-window{fill:var(--anatomy-shade-0)}
.kr-led{fill:var(--anatomy-accent);stroke:none}
.kr-glow{fill:var(--anatomy-accent);filter:blur(3px);pointer-events:none}
.kr-bead{pointer-events:none}
.kr-bead-ring{fill:var(--anatomy-paper)}
.kr-bead-dot{fill:var(--anatomy-accent)}
.kr-knob{position:absolute;aspect-ratio:1;transform:translate(-50%,-50%);border:0;border-radius:50%;background:transparent;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent}
.kr-knob:hover{box-shadow:0 0 0 1px var(--anatomy-faint)}
.kr-knob:active{box-shadow:0 0 0 1px var(--anatomy-mid)}
.kr-knob:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:2px}
.kr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media (max-width:560px){
  .kr .iso-plate{padding-bottom:88px;overflow:hidden}
  .kr-stage{width:112%;margin:0 -6%}
  .kr .iso-plate-corner[data-corner="hint"]{bottom:40px}
}
`;

export function KitRackFigure({ className }: { className?: string | undefined }) {
  return (
    <div className={cn("iso kr", className)}>
      <style href="kit-rack-figure" precedence="default">
        {CSS}
      </style>
      <Plate
        fig="Fig 1"
        title="Swap the Layer"
        hint="Turn a knob to swap its Layer"
        readout={
          <>
            <span className="kr-line" data-line="redis">
              {lineOf("redis", REST.redis)}
            </span>
            <span className="kr-line" data-line="emails">
              {lineOf("emails", REST.emails)}
            </span>
          </>
        }
      >
        <KitRackArt />
      </Plate>
    </div>
  );
}
