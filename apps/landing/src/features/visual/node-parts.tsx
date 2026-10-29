/*
 * Adapted from Visual Effect (src/components/effect/{EffectNode,EffectContainer,EffectContent,
 * EffectOverlay,nodeVariants,useEffectMotion}.ts(x), src/components/Timer.tsx) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: one component driven by a plain `NodeState`, lucide icons for the outcomes, an
 * inline four-point star for idle, zinc theme tokens with a light variant, a 56px node, and
 * jitter, shake, glitch and shimmer skipped under reduced motion.
 */
import { type ReactNode, useEffect, useState } from "react";

import { OctagonAlertIcon, SkullIcon } from "lucide-react";
import { motion, type MotionValue } from "motion/react";

import { cn } from "@/lib/cn";

import { blurTween, springs } from "./motion";
import type { NodeState } from "./runtime";

export function Shimmer() {
  return (
    <>
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((offset) => (
        <motion.div
          key={offset}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[200%] mix-blend-lighten blur-[4px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, transparent 40%, rgb(255 255 255 / 0.1) 45%, rgb(255 255 255 / 0.5) 50%, rgb(255 255 255 / 0.1) 55%, transparent 60%, transparent 100%)",
          }}
          animate={{ x: ["-66%", "50%"] }}
          transition={{ duration: 0.8, delay: offset, repeat: Infinity, ease: [0.5, 0, 0.1, 1] }}
        />
      ))}
    </>
  );
}

const iconMotion = {
  initial: { scale: 0, filter: "blur(10px)" },
  animate: { scale: 1, filter: "blur(0px)" },
  exit: { scale: 0, filter: "blur(10px)" },
} as const;

export function Content({ state }: { readonly state: NodeState }) {
  switch (state._tag) {
    case "Running":
      return null;
    case "Succeeded":
      return (
        <motion.span
          key="value"
          initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
          transition={{ ...springs.contentScale, filter: blurTween }}
          className="block font-mono text-[13px] font-semibold"
        >
          {state.value}
        </motion.span>
      );
    case "Failed":
    case "Died":
    case "Interrupted": {
      const Icon = state._tag === "Interrupted" ? OctagonAlertIcon : SkullIcon;

      return (
        <motion.span
          key={state._tag}
          {...iconMotion}
          transition={{
            type: "spring",
            bounce: state._tag === "Interrupted" ? 0.5 : 0.3,
            visualDuration: 0.3,
            filter: blurTween,
          }}
          className="block"
        >
          <Icon
            aria-hidden="true"
            className={cn("size-6", state._tag === "Died" ? "text-red-500" : "text-white/90")}
          />
        </motion.span>
      );
    }
    case "Idle":
      return (
        <motion.span
          key="idle"
          {...iconMotion}
          transition={{ type: "spring", bounce: 0.3, visualDuration: 0.3, filter: blurTween }}
          className="block"
        >
          <StarFour />
        </motion.span>
      );
  }
}

/** Visual Effect's idle glyph (Phosphor's StarFour), drawn inline. */
export function StarFour() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-7 text-zinc-400 dark:text-zinc-500"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d="M12 3Q14.3 9.7 21 12Q14.3 14.3 12 21Q9.7 14.3 3 12Q9.7 9.7 12 3Z" />
    </svg>
  );
}

function formatElapsed(ms: number) {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

/** Live elapsed time while running, then the final duration. */
export function Elapsed({ state }: { readonly state: NodeState }) {
  const [now, setNow] = useState(0);
  const running = state._tag === "Running";

  useEffect(() => {
    if (!running) return;

    let frame = 0;
    const tick = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [running]);

  if (state._tag === "Running") return formatElapsed(Math.max(0, now - state.startedAt));
  if ("endedAt" in state) return formatElapsed(state.endedAt - state.startedAt);

  return null;
}

export function ContentLayer({
  opacity,
  scale,
  children,
}: {
  readonly opacity: MotionValue<number>;
  readonly scale: MotionValue<number>;
  readonly children: ReactNode;
}) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-2 text-white"
      style={{ opacity, scale }}
    >
      {children}
    </motion.div>
  );
}
