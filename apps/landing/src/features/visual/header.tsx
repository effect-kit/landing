/*
 * Adapted from Visual Effect (src/components/HeaderView.tsx) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: lucide icons, no deep-link copy, a light variant, and the action icon also shows on
 * keyboard focus.
 */
import { useState } from "react";

import {
  CheckIcon,
  LoaderCircleIcon,
  OctagonAlertIcon,
  PlayIcon,
  RotateCcwIcon,
  SkullIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/cn";

import { blurTween, springs } from "./motion";
import type { NodeTag } from "./runtime";

const swatch: Record<NodeTag, string> = {
  Idle: "bg-green-700",
  Running: "bg-blue-500",
  Succeeded: "bg-green-700",
  Failed: "bg-red-500",
  Interrupted: "bg-orange-500",
  Died: "bg-red-900",
};

const icons = {
  play: PlayIcon,
  stop: SquareIcon,
  reset: RotateCcwIcon,
  running: LoaderCircleIcon,
  Succeeded: CheckIcon,
  Failed: XIcon,
  Interrupted: OctagonAlertIcon,
  Died: SkullIcon,
} as const;

/**
 * The whole header is the run control, as in Visual Effect: it plays when idle, stops while
 * running and resets when done. The square morphs between the state and the next action.
 */
export function RunHeader({
  tag,
  api,
  qualifier,
  description,
  reduced,
  onAction,
}: {
  readonly tag: NodeTag;
  readonly api: string;
  readonly qualifier: string | undefined;
  readonly description: string;
  readonly reduced: boolean;
  readonly onAction: () => void;
}) {
  const [engaged, setEngaged] = useState(false);
  const [pressed, setPressed] = useState(false);

  const running = tag === "Running";
  const action = tag === "Idle" ? "play" : running ? "stop" : "reset";
  const verb = action === "play" ? "Run" : action === "stop" ? "Stop" : "Reset";
  const shown: keyof typeof icons = engaged || tag === "Idle" ? action : running ? "running" : tag;
  const Icon = icons[shown];
  const name = qualifier ? `${api} (${qualifier})` : api;

  return (
    <button
      type="button"
      aria-label={`${verb} ${name}`}
      onClick={onAction}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => {
        setEngaged(false);
        setPressed(false);
      }}
      onFocus={(event) => setEngaged(event.currentTarget.matches(":focus-visible"))}
      onBlur={() => setEngaged(false)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      className="group flex w-full min-w-0 items-center gap-4 bg-zinc-100 px-4 py-4 text-start transition-colors hover:bg-zinc-200/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ek-accent sm:px-6 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
    >
      <motion.span
        animate={{ scale: pressed ? 0.95 : engaged ? 1.05 : 1 }}
        transition={springs.icon}
        className={cn(
          "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg text-white transition-colors duration-200",
          swatch[tag],
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={shown}
            initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
            animate={
              shown === "running" && !reduced
                ? { scale: 1, rotate: 360, filter: "blur(0px)" }
                : { scale: 1, rotate: 0, filter: "blur(0px)" }
            }
            exit={{ scale: 0, rotate: 180, filter: "blur(10px)" }}
            transition={
              shown === "running"
                ? {
                    rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                    scale: springs.icon,
                    filter: blurTween,
                  }
                : { ...springs.icon, filter: blurTween }
            }
            className="grid place-items-center"
          >
            <Icon
              aria-hidden="true"
              className={cn("size-5", (shown === "play" || shown === "stop") && "fill-current")}
            />
          </motion.span>
        </AnimatePresence>
        {running && !reduced ? (
          <motion.span
            aria-hidden="true"
            className="absolute -inset-0.5 -z-10 bg-[radial-gradient(circle,var(--color-blue-500)_0%,transparent_70%)]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </motion.span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-[15px] leading-tight font-semibold break-words text-fd-foreground">
          {api}
          {qualifier ? (
            <span className="font-normal text-fd-muted-foreground"> {qualifier}</span>
          ) : null}
        </span>
        <span className="text-sm leading-snug text-pretty text-fd-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
