/*
 * The floating highlight is adapted from Visual Effect (src/components/feedback/
 * FloatingHighlight.tsx) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: the code itself is Shiki Magic Move, so variants morph instead of swapping, and the
 * highlight re-measures when a morph ends or the panel resizes.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { ShikiMagicMovePrecompiled } from "@shikijs/magic-move/react";
import type { KeyedTokensInfo } from "@shikijs/magic-move/types";
import { animate, motion, useMotionValue, useSpring, useTransform } from "motion/react";

import "@shikijs/magic-move/style.css";

import { CopyButton } from "@/components/marketing/copy-button";
import { track } from "@/lib/analytics/client";

const MAGIC_OPTIONS = { duration: 650, stagger: 0.3, lineNumbers: false } as const;
const highlightSpring = { bounce: 0, visualDuration: 0.2 };
const PAD_X = 6;
const PAD_Y = 3;

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Finds `target` in the rendered code and returns its box relative to `root`. Text is read in
 * DOM order, with `<br>` as a newline, so a target may span lines. Tokens that are leaving in
 * a morph are skipped.
 */
function measure(root: HTMLElement, code: HTMLElement, target: string): Box | null {
  const parts: { node: Text; start: number }[] = [];
  let text = "";

  const walker = document.createTreeWalker(code, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const leaving = (node instanceof Element ? node : node.parentElement)?.closest(
      ".shiki-magic-move-leave-active",
    );
    if (leaving) continue;

    if (node instanceof HTMLBRElement) text += "\n";
    else if (node instanceof Text) {
      parts.push({ node, start: text.length });
      text += node.data;
    }
  }

  const from = text.indexOf(target);
  if (from === -1) return null;

  const to = from + target.length;
  const start = parts.find((part) => from >= part.start && from < part.start + part.node.length);
  const end = parts.findLast((part) => to > part.start && to <= part.start + part.node.length);
  if (!start || !end) return null;

  const range = document.createRange();
  range.setStart(start.node, from - start.start);
  range.setEnd(end.node, to - end.start);

  const rects = [...range.getClientRects()].filter((rect) => rect.width > 0);
  if (rects.length === 0) return null;

  const origin = root.getBoundingClientRect();
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return { x: left - origin.left, y: top - origin.top, width: right - left, height: bottom - top };
}

/**
 * Server-tokenized code that morphs between variants, with a highlight that springs to the
 * code of the hovered or running step.
 */
export function CodePanel({
  steps,
  step,
  fallback,
  target,
  reduced,
  exampleId,
}: {
  /** The example the code belongs to, reported when the code is copied. */
  readonly exampleId: string;
  /** Every variant, tokenized by `visualCode`. Empty when the loader didn't provide them. */
  readonly steps: readonly KeyedTokensInfo[];
  readonly step: number;
  /** The current variant as plain text: shown when tokens are missing, and what copy copies. */
  readonly fallback: string;
  readonly target: string | null;
  readonly reduced: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const [moving, setMoving] = useState(false);

  const x = useSpring(0, highlightSpring);
  const y = useSpring(0, highlightSpring);
  const width = useSpring(0, highlightSpring);
  const height = useSpring(0, highlightSpring);
  const opacity = useMotionValue(0);
  const filter = useTransform(opacity, [0, 1], ["blur(4px)", "blur(0px)"]);

  const place = useCallback(() => {
    const root = rootRef.current;
    const code = codeRef.current;
    const box = root && code && target && !moving ? measure(root, code, target) : null;

    if (!box) {
      animate(opacity, 0, { ease: "linear", duration: 0.15 });
      return;
    }

    const next = {
      x: box.x - PAD_X,
      y: box.y - PAD_Y,
      width: box.width + PAD_X * 2,
      height: box.height + PAD_Y * 2,
    };

    // From hidden, appear in place instead of flying in from the last spot.
    const jump = opacity.get() < 0.05 || reduced;
    for (const [value, to] of [
      [x, next.x],
      [y, next.y],
      [width, next.width],
      [height, next.height],
    ] as const) {
      if (jump) value.jump(to);
      else value.set(to);
    }

    animate(opacity, 1, { ease: "linear", duration: 0.15 });
  }, [target, moving, reduced, x, y, width, height, opacity]);

  // Measure after the renderer has replaced the tokens for a new step (it does so in an effect).
  const stepKey = `${step}/${steps.length}`;
  useEffect(() => {
    if (!stepKey) return;

    const frame = requestAnimationFrame(place);

    return () => cancelAnimationFrame(frame);
  }, [place, stepKey]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new ResizeObserver(() => place());
    observer.observe(root);

    return () => observer.disconnect();
  }, [place]);

  const animated = !reduced;

  return (
    <div className="relative">
      <CopyButton
        text={fallback}
        surface="playground"
        onCopied={() =>
          track("code_copied", {
            snippet_id: exampleId,
            surface: "playground",
            lines: fallback.split("\n").length,
          })
        }
        className="absolute top-2 right-2 z-10 bg-fd-background/80 backdrop-blur-sm"
      />
      <div className="overflow-x-auto py-5">
        <div ref={rootRef} className="relative inline-block min-w-full">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 rounded-md border border-sky-500/60 bg-sky-400/15 shadow-[0_0_10px_rgb(56_189_248/0.25)] dark:border-sky-400/60"
            style={{ x, y, width, height, opacity, filter }}
          />
          <div ref={codeRef} className="ek-code ek-magic relative text-[13px] leading-[1.7]">
            {steps.length > 0 ? (
              <ShikiMagicMovePrecompiled
                steps={steps as KeyedTokensInfo[]}
                step={step}
                animate={animated}
                options={MAGIC_OPTIONS}
                onStart={() => setMoving(true)}
                onEnd={() => setMoving(false)}
              />
            ) : (
              <pre className="px-5 font-mono text-fd-muted-foreground">{fallback}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
