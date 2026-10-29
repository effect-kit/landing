/*
 * Adapted from Visual Effect (src/components/ScheduleTimeline.tsx) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: segments come from the run store instead of being derived inside the component,
 * zinc theme tokens, a grid of hairline ticks, and a stopped cursor under reduced motion.
 */
import { useEffect, useRef, useState } from "react";

import { motion } from "motion/react";

import { cn } from "@/lib/cn";

import type { TimelineSegment } from "./runtime";

const HEIGHT = 72;
const PX_PER_SECOND = 240;
const START = 24;
const TICK = 40;
const dotSpring = { type: "spring", visualDuration: 0.5, bounce: 0.4 } as const;

/**
 * The retry timeline: blue spans while the step runs, grey gaps while the schedule waits,
 * at 240px per second, with a cursor that follows the clock and scrolls past 80% width.
 */
export function ScheduleTimeline({
  segments,
  active,
}: {
  readonly segments: readonly TimelineSegment[];
  readonly active: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(0);
  const [width, setWidth] = useState(480);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 480));
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const tick = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [active]);

  const origin = segments[0]?.start ?? 0;
  const lastEnd = segments.reduce((max, segment) => Math.max(max, segment.end ?? 0), origin);
  const clock = active ? Math.max(now, lastEnd) : lastEnd;
  const x = (time: number) => START + ((time - origin) / 1000) * PX_PER_SECOND;
  const cursor = segments.length > 0 ? x(clock) : START;
  const scroll = Math.max(0, cursor - width * 0.8);
  const ticks = Math.ceil((width + scroll) / TICK);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative w-full overflow-hidden"
      style={{ height: HEIGHT }}
    >
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-(--ek-line-strong)" />
      {Array.from({ length: ticks }, (_, index) => {
        const left = (index + 1) * TICK - scroll;

        return left < -TICK || left > width + TICK ? null : (
          <div key={index} className="absolute inset-y-0 w-px bg-(--ek-line)" style={{ left }} />
        );
      })}

      {segments.map((segment) => {
        const left = x(segment.start) - scroll;
        const end = segment.end ?? clock;
        const span = Math.max(0, x(end) - x(segment.start));
        const live = segment.end === null && active;

        if (segment.kind === "waiting") {
          const ms = Math.round(end - segment.start);

          return (
            <div key={`w${segment.start}`}>
              <div
                className={cn(
                  "absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full",
                  live ? "bg-zinc-400" : "bg-zinc-500/70",
                )}
                style={{ left, width: span }}
              />
              {span > 50 ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-1/2 rounded border border-(--ek-line-strong) bg-fd-card px-1.5 py-px font-mono text-[10px] whitespace-nowrap text-fd-muted-foreground tabular-nums"
                  style={{ left: left + span / 2, translateX: "-50%", translateY: "-50%" }}
                >
                  {ms}ms
                </motion.span>
              ) : null}
            </div>
          );
        }

        return (
          <div key={`r${segment.start}`}>
            <div
              className={cn(
                "absolute top-1/2 h-[3px] -translate-y-1/2",
                live ? "bg-blue-400" : "bg-blue-500",
              )}
              style={{ left, width: span }}
            />
            {[left, ...(segment.end === null ? [] : [left + span])].map((at, index) => (
              <motion.span
                key={index === 0 ? "start" : "end"}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={dotSpring}
                className={cn(
                  "absolute top-1/2 z-10 -mt-1.5 -ml-1.5 size-3 rounded-full",
                  live ? "bg-blue-400" : "bg-blue-500",
                )}
                style={{ left: at }}
              />
            ))}
          </div>
        );
      })}

      <div
        className={cn(
          "absolute inset-y-0 w-[3px] transition-colors duration-300",
          active ? "bg-fd-foreground" : "bg-fd-muted-foreground/60",
        )}
        style={{ left: cursor - scroll }}
      />
    </div>
  );
}
