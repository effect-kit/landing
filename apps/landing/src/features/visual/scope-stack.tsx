/*
 * Adapted from Visual Effect (src/components/scope/{ScopeStack,FinalizerCard}.tsx) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: cards come from the run store, lucide chevrons, a light variant, a card that fits
 * narrow screens, and the chevrons only pulse while the program runs (never under reduced motion).
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/cn";

import { springs } from "./motion";
import type { FinalizerCard as Card } from "./runtime";

const STACK_OFFSET = 35;
const EDGE = 16;

function Chevrons({ from, live }: { readonly from: number; readonly live: boolean }) {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="block"
          initial={false}
          animate={live ? { opacity: [0.25, 1, 0.25] } : { opacity: 0.45 }}
          transition={
            live
              ? {
                  duration: 2,
                  repeat: Infinity,
                  delay: (from + index) * 0.12,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        >
          <ChevronRightIcon aria-hidden="true" className="size-3.5" />
        </motion.span>
      ))}
    </span>
  );
}

function FinalizerCard({ card }: { readonly card: Card }) {
  const running = card.state === "running";
  const completed = card.state === "completed";
  const previous = useRef(card.state);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const before = previous.current;
    previous.current = card.state;
    if (before === "completed" || card.state !== "completed") return;

    setFlash(true);

    const timeout = setTimeout(() => setFlash(false), 600);

    return () => clearTimeout(timeout);
  }, [card.state]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.2, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
      transition={{ type: "spring", visualDuration: 0.3, bounce: 0.3 }}
      className={cn(
        "relative flex h-[52px] items-center gap-3 rounded-lg border px-4 shadow-[0_8px_20px_rgb(0_0_0/0.12)] dark:shadow-[0_8px_20px_rgb(0_0_0/0.4)] transition-colors duration-200",
        card.state === "pending" &&
          "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800",
        running && "border-blue-500 bg-blue-50 dark:bg-blue-950",
        completed && "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-950",
      )}
    >
      <span
        className={cn(
          "relative grid size-6 shrink-0 place-items-center rounded border transition-colors duration-200",
          completed
            ? "border-green-600 bg-green-600 dark:border-green-500 dark:bg-green-500"
            : running
              ? "border-blue-500 bg-blue-100 dark:bg-blue-900"
              : "border-zinc-400 bg-zinc-200 dark:border-zinc-500 dark:bg-zinc-700",
        )}
      >
        <AnimatePresence mode="popLayout">
          {completed ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -180, filter: "blur(10px)" }}
              animate={{ scale: 1, rotate: 0, filter: "blur(0px)" }}
              exit={{ scale: 0, rotate: 180, filter: "blur(10px)" }}
              transition={springs.icon}
              className="grid place-items-center"
            >
              <CheckIcon aria-hidden="true" strokeWidth={3} className="size-3.5 text-white" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
      {flash ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,rgb(34_197_94/0.4)_0%,transparent_70%)]"
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ) : null}
      <span
        className={cn(
          "relative font-mono text-sm font-medium whitespace-nowrap",
          card.state === "pending" && "text-fd-foreground",
          running && "text-blue-700 dark:text-blue-300",
          completed && "text-green-800 dark:text-green-300",
        )}
      >
        {card.name}
      </span>
    </motion.div>
  );
}

/**
 * The scope's finalizers: registered cards wait on the left, the one being released moves to
 * the middle, and released ones settle on the right. Releases run last in, first out.
 */
export function ScopeStack({
  finalizers,
  live,
  reduced,
}: {
  readonly finalizers: readonly Card[];
  /** The program is running; the chevrons pulse. */
  readonly live: boolean;
  readonly reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    setWidth(element.offsetWidth);

    const observer = new ResizeObserver(() => setWidth(element.offsetWidth));
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const cardWidth = Math.min(200, width - EDGE * 2);
  const pending = finalizers.filter((card) => card.state === "pending");
  const completed = finalizers.filter((card) => card.state === "completed");
  const pulse = live && !reduced;

  return (
    <div
      ref={ref}
      className="relative h-[88px] overflow-hidden rounded-xl border border-dashed border-(--ek-line-strong)"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center gap-3 font-mono text-xs tracking-[0.3em] text-fd-muted-foreground/70 uppercase"
      >
        <Chevrons from={0} live={pulse} />
        Finalizers
        <Chevrons from={3} live={pulse} />
      </div>
      {width > 0 ? (
        <AnimatePresence mode="popLayout">
          {finalizers.map((card) => {
            let x = EDGE;
            let z = 10;

            if (card.state === "running") {
              x = (width - cardWidth) / 2;
              z = 20;
            } else if (card.state === "pending") {
              const index = pending.indexOf(card);
              x = EDGE + index * STACK_OFFSET;
              z = 10 + index;
            } else {
              const index = completed.indexOf(card);
              x = width - EDGE - cardWidth - (completed.length - 1 - index) * STACK_OFFSET;
              z = 10 - index;
            }

            return (
              <motion.div
                key={card.id}
                className="absolute top-[17px] left-0"
                style={{ zIndex: z, width: cardWidth }}
                initial={false}
                animate={{ x, scale: card.state === "running" ? 1.05 : 1 }}
                transition={{ type: "spring", visualDuration: 0.5, bounce: 0 }}
              >
                <FinalizerCard card={card} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      ) : null}
    </div>
  );
}
