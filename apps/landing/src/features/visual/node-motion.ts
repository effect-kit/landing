/*
 * Adapted from Visual Effect (src/components/effect/{EffectNode,EffectContainer,EffectContent,
 * EffectOverlay,nodeVariants,useEffectMotion}.ts(x), src/components/Timer.tsx) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: one component driven by a plain `NodeState`, lucide icons for the outcomes, an
 * inline four-point star for idle, zinc theme tokens with a light variant, a 56px node, and
 * jitter, shake, glitch and shimmer skipped under reduced motion.
 */
import { useEffect, useRef } from "react";

import { animate, useMotionValue, useSpring, useTransform, useVelocity } from "motion/react";

import {
  between,
  chain,
  delay,
  glitch,
  NODE_SIZE,
  nextFrame,
  shake,
  sign,
  springs,
  timing,
} from "./motion";
import type { NodeTag } from "./runtime";

/** Corner radius of a resting node; the running pill animates it. */
export const RADIUS = 8;

export function useMotionBag() {
  const nodeWidth = useSpring(NODE_SIZE, springs.default);
  const nodeHeight = useMotionValue(NODE_SIZE);
  const borderRadius = useSpring(RADIUS, springs.default);
  const rotation = useMotionValue(0);
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const contentScale = useSpring(1, springs.default);
  const contentOpacity = useSpring(1, springs.default);
  const flashOpacity = useMotionValue(0);
  const borderOpacity = useSpring(1, springs.default);
  const glowIntensity = useSpring(0, springs.default);

  // Fast rotation blurs the node slightly, which sells the jitter.
  const blurAmount = useTransform(useVelocity(rotation), [-100, 0, 100], [1, 0, 1], {
    clamp: true,
  });

  return {
    nodeWidth,
    nodeHeight,
    borderRadius,
    rotation,
    shakeX,
    shakeY,
    contentScale,
    contentOpacity,
    flashOpacity,
    borderOpacity,
    glowIntensity,
    blurAmount,
  };
}

export type MotionBag = ReturnType<typeof useMotionBag>;

export function settle(values: MotionBag) {
  const { duration, ease } = timing.exit;
  animate(values.rotation, 0, { duration, ease });
  animate(values.shakeX, 0, { duration, ease });
  animate(values.shakeY, 0, { duration, ease });
}

/** Squash into a pill, pulse the border and glow, and jitter until the step ends. */
export function useRunning(running: boolean, reduced: boolean, values: MotionBag) {
  useEffect(() => {
    values.borderRadius.set(running ? 15 : RADIUS);
    values.contentOpacity.set(running ? 0 : 1);
    animate(values.nodeHeight, running ? NODE_SIZE * 0.4 : NODE_SIZE, {
      type: "spring",
      duration: 0.4,
      bounce: running ? 0.3 : 0.5,
    });

    if (!running || reduced) {
      values.borderOpacity.set(1);
      values.glowIntensity.set(0);
      settle(values);
      return;
    }

    const border = animate(values.borderOpacity, [...timing.borderPulse.values], {
      duration: timing.borderPulse.duration,
      ease: "easeInOut",
      repeat: Infinity,
    });
    const glow = animate(values.glowIntensity, [...timing.glowPulse.values], {
      duration: timing.glowPulse.duration,
      ease: "easeInOut",
      repeat: Infinity,
    });

    const s = shake.running;

    const stop = chain(() => {
      const duration = between(s.durationMin, s.durationMax);
      return Promise.all([
        animate(values.rotation, between(s.angleBase, s.angleBase + s.angleRange) * sign(), {
          duration,
          ease: "circInOut",
        }).finished,
        animate(values.shakeX, between(s.offsetBase, s.offsetBase + s.offsetRange) * sign(), {
          duration,
          ease: "easeInOut",
        }).finished,
        animate(values.shakeY, between(s.offsetYBase, s.offsetYBase + s.offsetYRange) * sign(), {
          duration,
          ease: "easeInOut",
        }).finished,
      ]).then(nextFrame);
    });

    return () => {
      stop();
      border.stop();
      glow.stop();
      values.borderOpacity.set(1);
      values.glowIntensity.set(0);
      settle(values);
    };
  }, [running, reduced, values]);
}

/** One-shot effects on state edges: flash and pop, shake, and the death glitch. */
export function useTransitions(tag: NodeTag, reduced: boolean, values: MotionBag) {
  const previous = useRef<NodeTag>(tag);

  useEffect(() => {
    const before = previous.current;
    previous.current = tag;

    if (before === tag) return;

    if (tag === "Running" || tag === "Succeeded") {
      const up = animate(values.flashOpacity, 0.6, { duration: 0.02, ease: "circOut" });
      void up.finished.then(() =>
        reduced ? values.flashOpacity.set(0) : animate(values.flashOpacity, 0, timing.flash),
      );
    }

    if (tag === "Succeeded" && !reduced) {
      values.contentScale.set(0);
      animate(values.contentScale, [1.3, 1], springs.contentScale);
    }
  }, [tag, reduced, values]);

  useEffect(() => {
    if ((tag !== "Failed" && tag !== "Died") || reduced) return;

    const { intensity, duration, count, rotationRange, returnDuration } = shake.failure;

    return chain((index) => {
      if (index < count) {
        return Promise.all([
          animate(values.shakeX, (Math.random() - 0.5) * intensity, { duration }).finished,
          animate(values.shakeY, (Math.random() - 0.5) * intensity, { duration }).finished,
          animate(values.rotation, (Math.random() - 0.5) * rotationRange, { duration }).finished,
        ]);
      }

      animate(values.shakeX, 0, { duration: returnDuration, ease: "easeOut" });
      animate(values.shakeY, 0, { duration: returnDuration, ease: "easeOut" });
      animate(values.rotation, 0, { duration: returnDuration, ease: "easeOut" });
      return undefined;
    });
  }, [tag, reduced, values]);

  useEffect(() => {
    if (tag !== "Died" || reduced) return;

    const t = timing.glitch;

    // Three sharp spikes, then a faint flicker that stays while the node is dead.
    const stop = chain((index) => {
      const spike = Math.floor(index / 2);
      if (spike < t.initialCount) {
        if (index % 2 === 0) {
          values.contentScale.set(1 + Math.random() * glitch.scaleRange);
          values.glowIntensity.set(Math.random() * glitch.intensePulseMax);
          return delay(between(t.initialDelayMin, t.initialDelayMax));
        }

        values.contentScale.set(1);
        values.glowIntensity.set(glitch.glowMax);
        return delay(between(t.pauseMin, t.pauseMax));
      }

      values.glowIntensity.set(between(glitch.glowMin, glitch.glowMax));
      return delay(between(t.subtleDelayMin, t.subtleDelayMax));
    });

    return () => {
      stop();
      values.glowIntensity.set(0);
    };
  }, [tag, reduced, values]);
}
