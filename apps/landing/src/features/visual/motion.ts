/*
 * Adapted from Visual Effect (src/animations.ts) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 */

/** Spring presets shared by every node, bubble and highlight. */
export const springs = {
  default: { type: "spring", stiffness: 180, damping: 25, mass: 0.8 },
  bouncy: { type: "spring", bounce: 0.3, visualDuration: 0.5 },
  contentScale: { type: "spring", bounce: 0.3, visualDuration: 0.5, stiffness: 260, damping: 18 },
  failureBubble: { type: "spring", visualDuration: 0.2, delay: 0.05, bounce: 0.3 },
  icon: { type: "spring", stiffness: 300, damping: 20 },
} as const;

/** Springs overshoot and blur must not go negative, so filters ease instead. */
export const blurTween = { type: "tween", duration: 0.25, ease: "easeOut" } as const;

export const shake = {
  /** The small random wobble of a running node. */
  running: {
    angleRange: 4,
    angleBase: 0.5,
    offsetRange: 1.5,
    offsetBase: 0.5,
    offsetYRange: 0.6,
    offsetYBase: 0.1,
    durationMin: 0.1,
    durationMax: 0.2,
  },
  failure: { intensity: 8, duration: 0.08, count: 6, rotationRange: 8, returnDuration: 0.3 },
  bubble: {
    intensity: 4,
    duration: 0.08,
    count: 4,
    rotationRange: 4,
    yOffset: -5,
    returnDuration: 0.3,
    delay: 100,
  },
} as const;

export const timing = {
  borderPulse: { duration: 1.5, values: [1, 0.3, 1] },
  glowPulse: { duration: 0.5, values: [1, 5, 1] },
  flash: { duration: 1, ease: "linear" },
  exit: { duration: 0.3, ease: [0.4, 0, 0.6, 1] },
  glitch: {
    initialCount: 3,
    initialDelayMin: 20,
    initialDelayMax: 70,
    pauseMin: 50,
    pauseMax: 150,
    subtleDelayMin: 300,
    subtleDelayMax: 800,
  },
} as const;

export const glitch = { scaleRange: 0.2, glowMin: 3, glowMax: 7, intensePulseMax: 10 } as const;

/** Node size in px. Running nodes squash to 40% of this height. */
export const NODE_SIZE = 56;

/** Random number in [min, max). */
export const between = (min: number, max: number) => min + Math.random() * (max - min);

/** Randomly -1 or 1. */
export const sign = () => (Math.random() < 0.5 ? -1 : 1);

/**
 * Runs animation steps one after another: `next(index)` starts step `index` and returns a
 * promise for it, or `undefined` to finish. Returns a function that stops the chain.
 */
export function chain(next: (index: number) => Promise<unknown> | undefined): () => void {
  let cancelled = false;
  const run = (index: number): void => {
    if (cancelled) return;
    void next(index)?.then(() => run(index + 1));
  };
  run(0);

  return () => {
    cancelled = true;
  };
}

/** Resolves after `ms`. */
export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Resolves on the next animation frame. */
export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
