import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

export interface AsciiFieldProps {
  /** Glyphs from faint to strong; the field maps its height onto them. */
  readonly glyphs?: string;
  /** Changes the terrain so each page gets its own field. */
  readonly seed?: number;
  /** Drift speed multiplier. */
  readonly speed?: number;
  readonly className?: string;
}

const CELL_W = 11;
const CELL_H = 15;

/** Fast deterministic pseudo-noise built from layered sines; smooth enough for contours. */
function terrain(x: number, y: number, t: number, seed: number) {
  const s = seed * 1.618;
  return (
    Math.sin(x * 0.11 + t * 0.35 + s) * Math.cos(y * 0.17 - t * 0.22 + s * 0.5) +
    0.55 * Math.sin((x + y) * 0.07 + t * 0.5 - s) +
    0.35 * Math.sin(x * 0.23 - y * 0.19 - t * 0.41 + s * 2.1) +
    0.2 * Math.cos(Math.hypot(x - 40 - s * 3, y - 6) * 0.12 - t * 0.6)
  );
}

/**
 * A quiet terrain of contour lines drawn with monospace glyphs (after Griffin's banner).
 * Canvas 2D, DPR capped at 2, paused off-screen, a single static frame for reduced motion.
 */
export function AsciiField({ glyphs = "·/=≡", seed = 1, speed = 1, className }: AsciiFieldProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = wrapper.current;
    const element = canvas.current;
    const context = element?.getContext("2d", { alpha: true });
    if (!host || !element || !context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ramp = [...glyphs];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let frame = 0;
    let tick = 0;
    let visible = false;
    let color = "#888";
    let pointer: { x: number; y: number } | null = null;
    const started = performance.now();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      element.width = Math.max(1, Math.floor(width * dpr));
      element.height = Math.max(1, Math.floor(height * dpr));
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      color = getComputedStyle(host).color;
    };

    const draw = (time: number) => {
      const t = ((time - started) / 1000) * 0.6 * speed;
      const cols = Math.ceil(width / CELL_W) + 1;
      const rows = Math.ceil(height / CELL_H) + 1;
      context.clearRect(0, 0, width, height);
      context.font = `400 11px "JetBrains Mono Variable", ui-monospace, monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = color;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let value = terrain(col, row, t, seed);
          if (pointer) {
            const dx = (col * CELL_W - pointer.x) / 90;
            const dy = (row * CELL_H - pointer.y) / 90;
            value += 0.9 * Math.exp(-(dx * dx + dy * dy));
          }
          // Contours: draw only near the bands of the height field.
          const band = Math.abs(((value * 2.4) % 1) + 1) % 1;
          if (band > 0.34) continue;
          const level = Math.min(ramp.length - 1, Math.max(0, Math.floor((value + 1.6) * 0.9)));
          context.globalAlpha = 0.18 + level * 0.16 * (1 - band * 1.6);
          context.fillText(
            ramp[level] ?? "·",
            col * CELL_W + CELL_W / 2,
            row * CELL_H + CELL_H / 2,
          );
        }
      }
      context.globalAlpha = 1;
    };

    const loop = (time: number) => {
      frame = 0;
      if (!visible) return;
      tick++;
      if (tick % 2 === 0) draw(time);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced) {
        draw(started + 4000);
        return;
      }
      if (!frame) frame = requestAnimationFrame(loop);
    };

    resize();
    draw(started);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    resizeObserver.observe(host);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) start();
    });
    intersection.observe(host);

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced) return;
      const rect = host.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onLeave = () => {
      pointer = null;
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [glyphs, seed, speed]);

  return (
    <div
      ref={wrapper}
      aria-hidden="true"
      className={cn("relative overflow-hidden text-fd-muted-foreground", className)}
    >
      <canvas ref={canvas} className="absolute inset-0" />
    </div>
  );
}
