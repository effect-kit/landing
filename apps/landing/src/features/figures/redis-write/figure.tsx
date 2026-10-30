import { Plate } from "@/components/iso/react/draw";
import { cn } from "@/lib/cn";

import { ART } from "./art";
import { RedisWriteLive } from "./live";
import { startSim, wordsOf } from "./model";

import "./redis-write.css";

const LABEL =
  "A bench with a client unit on the left and a Redis server on the right, joined by one line through a knife switch on an insulating base. A red bead is the command: it waits in the client's send tray, passes a small gate when it is written, runs along the line to the server, and a counter on the server ticks when the write is applied. A reply bead comes back. Cut the switch while the command is still queued and the client reports delivery unsent and sends it again; cut it after the command was written and it reports possibly-written, so the client reads the key back instead of sending it twice.";

export function RedisWriteFigure({
  className,
  fig = "Fig 1",
}: {
  className?: string | undefined;
  /** Label in the top-left corner; posts number their figures. */
  fig?: string;
}) {
  return (
    <div className={cn("iso rw", className)}>
      <Plate
        fig={fig}
        title="How far it got"
        hint="Throw the switch to cut the connection"
        readout={wordsOf(startSim()).readout}
      >
        <RedisWriteLive label={LABEL} art={ART} />
      </Plate>
    </div>
  );
}
