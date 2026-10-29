/*
 * Adapted from Visual Effect (src/components/feedback/{FailureBubble,DeathBubble,
 * NotificationBubble}.tsx) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: bubbles slide sideways to stay inside the card; the arrow stays over the node.
 */
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { animate, motion, type MotionValue, useMotionValue, useTransform } from "motion/react";

import { cn } from "@/lib/cn";

import { blurTween, chain, shake, springs } from "./motion";

/** The gentle shake a failure bubble does right after it appears. */
function useBubbleShake(reduced: boolean) {
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const rotation = useMotionValue(0);

  useEffect(() => {
    if (reduced) return;

    const { intensity, duration, count, rotationRange, yOffset, returnDuration } = shake.bubble;
    let stop = () => {};

    const timer = setTimeout(() => {
      stop = chain((index) => {
        if (index < count) {
          const ease = "easeInOut";
          return Promise.all([
            animate(shakeX, (Math.random() - 0.5) * intensity, { duration, ease }).finished,
            animate(shakeY, (Math.random() - 0.5) * intensity + yOffset, { duration, ease })
              .finished,
            animate(rotation, (Math.random() - 0.5) * rotationRange, { duration, ease }).finished,
          ]);
        }

        animate(shakeX, 0, { duration: returnDuration, ease: "easeOut" });
        animate(shakeY, yOffset, { duration: returnDuration, ease: "easeOut" });
        animate(rotation, 0, { duration: returnDuration, ease: "easeOut" });
        return undefined;
      });
    }, shake.bubble.delay);

    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [reduced, shakeX, shakeY, rotation]);

  return { shakeX, shakeY, rotation };
}

const EDGE = 8;

/** How far to slide a bubble so it stays inside its card, in px. */
function useEdgeShift(ref: RefObject<HTMLElement | null>) {
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    const bounds = element?.closest("article")?.getBoundingClientRect();
    if (!element || !bounds) return;

    const box = element.getBoundingClientRect();
    const center = box.left + box.width / 2;
    const half = element.offsetWidth / 2;

    if (center - half < bounds.left + EDGE) setShift(bounds.left + EDGE - (center - half));
    else if (center + half > bounds.right - EDGE) setShift(bounds.right - EDGE - (center + half));
  }, [ref]);

  return shift;
}

function ShakingBubble({
  reduced,
  className,
  arrowClassName,
  children,
}: {
  readonly reduced: boolean;
  readonly className: string;
  readonly arrowClassName: string;
  readonly children: string;
}) {
  const { shakeX, shakeY, rotation } = useBubbleShake(reduced);
  const x = useTransform(shakeX, (value) => `calc(-50% + ${value}px)`);

  const boxRef = useRef<HTMLDivElement>(null);
  const shift = useEdgeShift(boxRef);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20, filter: "blur(5px)" }}
      animate={{ opacity: 1, scale: 1, y: -5, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.8, y: 20, filter: "blur(5px)" }}
      transition={{ ...springs.failureBubble, filter: blurTween }}
      style={{ x, y: shakeY, rotate: rotation }}
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2"
    >
      <div
        ref={boxRef}
        style={{ translate: `${shift}px 0` }}
        className={cn(
          "max-w-60 truncate rounded-md px-2 py-1 font-mono text-xs font-semibold whitespace-nowrap shadow-[0_0_16px_rgb(0_0_0/0.35)]",
          className,
        )}
      >
        {children}
      </div>
      <Arrow className={arrowClassName} />
    </motion.div>
  );
}

function Arrow({ className }: { readonly className: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute top-full left-1/2 size-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent",
        className,
      )}
    />
  );
}

export function FailureBubble({
  error,
  reduced,
}: {
  readonly error: string;
  readonly reduced: boolean;
}) {
  return (
    <ShakingBubble
      reduced={reduced}
      className="bg-red-500/95 text-red-50"
      arrowClassName="border-t-red-500/95"
    >
      {error}
    </ShakingBubble>
  );
}

const GLITCH_CHARSET = "@#$%&*/=-+?!~<>\\|█▓▒░";

/** Glitch characters derived from the message, so renders are stable. */
function scramble(message: string) {
  const length = Math.max(6, Math.min(message.length, 16));

  return Array.from({ length }, (_, index) => {
    const code = message.charCodeAt(index % Math.max(1, message.length)) || index;
    return GLITCH_CHARSET[(code * 31 + index * 17) % GLITCH_CHARSET.length];
  }).join("");
}

export function DeathBubble({
  error,
  reduced,
}: {
  readonly error: string;
  readonly reduced: boolean;
}) {
  // The defect is scrambled on purpose; the live region announces the real message.
  const glitched = useMemo(() => scramble(error), [error]);

  return (
    <ShakingBubble
      reduced={reduced}
      className="border border-red-600/90 bg-black/95 text-red-600"
      arrowClassName="border-t-black/95"
    >
      {glitched}
    </ShakingBubble>
  );
}

export function NotificationBubble({
  text,
  reduced,
}: {
  readonly text: string;
  readonly reduced: boolean;
}) {
  const floatY = useMotionValue(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const shift = useEdgeShift(boxRef);

  // The bubble lives for two seconds; it bobs gently while it is up.
  useEffect(() => {
    if (reduced) return;

    return chain(
      (index) =>
        animate(floatY, index % 2 === 0 ? -8 : 0, { duration: 0.8, ease: "easeInOut" }).finished,
    );
  }, [floatY, reduced]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 40, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0, y: 40, filter: "blur(10px)" }}
      transition={{ type: "spring", visualDuration: 0.3, bounce: 0.1, filter: blurTween }}
      style={{ x: "-50%" }}
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2"
    >
      <Float y={floatY}>
        <div
          ref={boxRef}
          style={{ translate: `${shift}px 0` }}
          className="rounded-md bg-blue-500 px-2.5 py-1 font-mono text-xs font-medium whitespace-nowrap text-white shadow-[0_8px_24px_rgb(0_0_0/0.3)]"
        >
          {text}
        </div>
        <Arrow className="border-t-blue-500" />
      </Float>
    </motion.div>
  );
}

function Float({ y, children }: { readonly y: MotionValue<number>; readonly children: ReactNode }) {
  return (
    <motion.div style={{ y }} className="relative">
      {children}
    </motion.div>
  );
}
