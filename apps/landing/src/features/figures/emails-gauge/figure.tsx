import { Plate } from "@/components/iso/react/draw";
import { cn } from "@/lib/cn";

import { EmailsGaugeArt } from "./art";
import { readoutOf, REST_SETUP } from "./model";

import "./emails-gauge.css";

export function EmailsGaugeFigure({ className }: { className?: string | undefined }) {
  return (
    <div className={cn("iso eg", className)}>
      <Plate
        fig="Fig 1"
        title="Capability gate"
        hint="Click the dial or the letter"
        readout={readoutOf(REST_SETUP, true)}
      >
        <EmailsGaugeArt />
      </Plate>
    </div>
  );
}
