/*
 * The segmented control is adapted from Visual Effect (src/components/ui/SegmentedControl.tsx)
 * by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: a fieldset with a visible legend, aria-pressed buttons, a light variant, and the
 * indicator measured in a layout effect so it never flashes at the wrong spot.
 */
import { useLayoutEffect, useRef, useState } from "react";

import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/cn";

import { setSoundEnabled, sounds, useSoundEnabled } from "./sounds";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ek-accent";

/** Mute toggle shared by every playground on the page (persisted in localStorage). */
export function SoundToggle({ className }: { readonly className?: string }) {
  const enabled = useSoundEnabled();
  const Icon = enabled ? Volume2Icon : VolumeXIcon;

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label="Sound"
      title={enabled ? "Sound on" : "Sound off"}
      onClick={() => {
        setSoundEnabled(!enabled);
        if (!enabled) void sounds.configChange();
      }}
      className={cn(
        "grid size-11 shrink-0 place-items-center text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground active:bg-fd-accent/70",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ek-accent",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}

/** Segmented control for an example's single input, with a sliding indicator. */
export function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const button = buttons.current.get(value);
      if (!button) return;
      setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
  }, [value]);

  return (
    <fieldset className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      <legend className="float-left font-mono text-xs tracking-[0.12em] text-fd-muted-foreground uppercase">
        {label}
      </legend>
      <div
        ref={containerRef}
        className="relative flex max-w-full rounded-lg border border-(--ek-line) bg-zinc-100/70 p-1 dark:bg-zinc-900/60"
      >
        {indicator ? (
          <motion.div
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-0 rounded-md bg-white shadow-[0_1px_2px_rgb(0_0_0/0.12),inset_0_0_0_1px_var(--ek-line)] dark:bg-zinc-700/80"
            initial={false}
            animate={{ x: indicator.left, width: indicator.width }}
            transition={{ type: "spring", visualDuration: 0.3, bounce: 0 }}
          />
        ) : null}
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              ref={(element) => {
                if (element) buttons.current.set(option.value, element);
                else buttons.current.delete(option.value);
              }}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                if (!selected) onChange(option.value);
              }}
              className={cn(
                "relative z-10 min-h-9 rounded-md px-3 font-mono text-[13px] whitespace-nowrap transition-colors duration-200",
                focusRing,
                selected
                  ? "font-medium text-fd-foreground"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Attribution for the MIT-licensed code these visuals adapt. */
export function VisualCredit({ className }: { readonly className?: string }) {
  return (
    <p
      className={cn(
        "text-center font-mono text-[11px] tracking-[0.14em] text-fd-muted-foreground uppercase",
        className,
      )}
    >
      Inspired by Kit Langton&apos;s{" "}
      <a
        href="https://github.com/kitlangton/visual-effect"
        title="Visual Effect by Kit Langton on GitHub"
        target="_blank"
        rel="noreferrer"
        className={cn(
          "rounded-sm text-fd-foreground underline decoration-fd-foreground/60 underline-offset-4 hover:decoration-current",
          focusRing,
        )}
      >
        Visual Effect
      </a>
    </p>
  );
}
