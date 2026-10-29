/*
 * Adapted from Visual Effect (src/components/effect/{EffectNode,EffectContainer,EffectContent,
 * EffectOverlay,nodeVariants,useEffectMotion}.ts(x), src/components/Timer.tsx) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: one component driven by a plain `NodeState`, lucide icons for the outcomes, an
 * inline four-point star for idle, zinc theme tokens with a light variant, a 56px node, and
 * jitter, shake, glitch and shimmer skipped under reduced motion.
 */
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useTransform } from "motion/react";

import { cn } from "@/lib/cn";

import { DeathBubble, FailureBubble, NotificationBubble } from "./bubbles";
import { NODE_SIZE, springs } from "./motion";
import { useMotionBag, useRunning, useTransitions } from "./node-motion";
import { Content, ContentLayer, Elapsed, Shimmer } from "./node-parts";
import type { NodeState, NodeTag, Notification } from "./runtime";

/** Visual Effect's semantic state colours; idle is a near-black tile (white in light mode). */
const background: Record<NodeTag, string> = {
  Idle: "bg-white dark:bg-zinc-950",
  Running: "bg-blue-500",
  Succeeded: "bg-green-700",
  Failed: "bg-red-500",
  Interrupted: "bg-orange-500",
  Died: "bg-red-900",
};

const variants = {
  Idle: { scale: 1, opacity: 1 },
  Running: { scale: 0.95, opacity: 1 },
  Succeeded: { scale: 1, opacity: 1 },
  Failed: { scale: 1, opacity: 1 },
  Interrupted: { scale: 1, opacity: 1 },
  Died: { scale: 1, opacity: 1 },
} as const;

interface EffectNodeProps {
  readonly state: NodeState;
  readonly label: string;
  readonly note: Notification | undefined;
  /** Show elapsed time in place of the label once the node has started. */
  readonly timer?: boolean;
  /** Only show the error bubble on hover (another node is already showing the failure). */
  readonly quiet?: boolean;
  readonly reduced: boolean;
  readonly onHover: (hovering: boolean) => void;
}

/** A 56px effect: idle, a jittering pill while running, then its outcome. */
export const EffectNode = memo(function EffectNode({
  state,
  label,
  note,
  timer = false,
  quiet = false,
  reduced,
  onHover,
}: EffectNodeProps) {
  const values = useMotionBag();
  const contentRef = useRef<HTMLSpanElement>(null);
  const [hovering, setHovering] = useState(false);

  const tag = state._tag;
  const running = tag === "Running";
  const failish = tag === "Failed" || tag === "Died";

  useRunning(running, reduced, values);
  useTransitions(tag, reduced, values);

  // Grow to fit the result value; shrink back otherwise.
  const value = state._tag === "Succeeded" ? state.value : null;

  useLayoutEffect(() => {
    const width = contentRef.current?.scrollWidth ?? 0;
    values.nodeWidth.set(value !== null && width > NODE_SIZE - 16 ? width + 24 : NODE_SIZE);
  }, [value, values]);

  // The error bubble shows for 1.5s after a failure, and again while hovered.
  const [expired, setExpired] = useState<NodeState | null>(null);

  useEffect(() => {
    if (!failish) return;

    const hide = setTimeout(() => setExpired(state), 1500);

    return () => clearTimeout(hide);
  }, [failish, state]);

  const showError = failish && (hovering || (!quiet && expired !== state));

  const filter = useTransform(values.blurAmount, (blur) => {
    const capped = Math.min(blur, 2);

    return tag === "Died" ? `blur(${capped}px) contrast(1.2) brightness(0.8)` : `blur(${capped}px)`;
  });

  const boxShadow = useTransform(values.glowIntensity, (glow) => {
    const base = running ? "0 0 24px rgb(59 130 246 / 0.2)" : "0 1px 2px rgb(0 0 0 / 0.25)";
    const capped = Math.min(glow, 8);

    if (capped <= 0) return base;

    return tag === "Died"
      ? `${base}, 0 0 ${capped * 2}px rgb(220 38 38 / 0.8)`
      : `${base}, 0 0 ${capped}px rgb(100 200 255 / 0.2)`;
  });

  return (
    <div
      className="relative flex flex-col items-center"
      onPointerEnter={() => {
        setHovering(true);
        onHover(true);
      }}
      onPointerLeave={() => {
        setHovering(false);
        onHover(false);
      }}
    >
      <AnimatePresence>
        {failish && showError ? (
          state._tag === "Died" ? (
            <DeathBubble key="death" error={state.error} reduced={reduced} />
          ) : state._tag === "Failed" ? (
            <FailureBubble key="failure" error={state.error} reduced={reduced} />
          ) : null
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {!failish && note ? (
          <NotificationBubble key={note.id} text={note.text} reduced={reduced} />
        ) : null}
      </AnimatePresence>

      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: values.nodeWidth, height: NODE_SIZE }}
      >
        <motion.div
          variants={variants}
          animate={tag}
          initial={false}
          transition={springs.default}
          className={cn(
            "absolute overflow-hidden transition-colors duration-100 ease-in-out",
            background[tag],
            tag === "Died"
              ? "border-2 border-red-600/40"
              : tag === "Idle"
                ? "border border-zinc-300 dark:border-zinc-800"
                : "border border-white/10",
          )}
          style={{
            width: values.nodeWidth,
            height: values.nodeHeight,
            borderRadius: values.borderRadius,
            rotate: values.rotation,
            x: values.shakeX,
            y: values.shakeY,
            filter,
            boxShadow,
            contain: "layout style paint",
          }}
        >
          {running ? (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgb(100_200_255/0.8)]"
              style={{ borderRadius: values.borderRadius, opacity: values.borderOpacity }}
            />
          ) : null}
          {running && !reduced ? <Shimmer /> : null}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-lg bg-white/80 mix-blend-overlay"
            style={{ opacity: values.flashOpacity }}
          />
          <ContentLayer opacity={values.contentOpacity} scale={values.contentScale}>
            <span ref={contentRef} className="whitespace-nowrap">
              <AnimatePresence mode="popLayout">
                <Content state={state} />
              </AnimatePresence>
            </span>
          </ContentLayer>
        </motion.div>
      </motion.div>

      <span
        className={cn(
          "mt-2 font-mono text-xs whitespace-nowrap tabular-nums transition-colors duration-300",
          tag === "Idle" ? "text-fd-muted-foreground" : "text-fd-foreground/80",
        )}
      >
        {timer && tag !== "Idle" ? <Elapsed state={state} /> : label}
      </span>
    </div>
  );
});
