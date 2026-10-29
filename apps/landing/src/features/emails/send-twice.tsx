import { useCallback, useEffect, useRef, useState } from "react";

import { RotateCcwIcon } from "lucide-react";

import { useInView, useReducedMotion } from "@/components/marketing/hooks";
import { cn } from "@/lib/cn";

import { ProviderMark } from "./provider-switch";

/**
 * The same send runs twice with one idempotency key, as a retry would. What happens depends on
 * the adapter's declared idempotency mode (from the package source):
 * Resend replays the first response, Brevo rejects the duplicate, Postmark has no idempotency,
 * so the key is refused before any request.
 */

const modes = {
  resend: {
    name: "Resend",
    mode: "replay",
    window: "keys kept 24 hours",
    first: { ok: true, text: "accepted, receipt #1", requests: 1 },
    second: { ok: true, text: "same receipt #1 returned", requests: 2 },
    inbox: 1,
  },
  brevo: {
    name: "Brevo",
    mode: "reject",
    window: "keys kept 30 minutes",
    first: { ok: true, text: "accepted, receipt #1", requests: 1 },
    second: { ok: false, text: "IdempotencyConflictError", requests: 2 },
    inbox: 1,
  },
  postmark: {
    name: "Postmark",
    mode: "unsupported",
    window: "no idempotency",
    first: { ok: false, text: "UnsupportedFeatureError: idempotency", requests: 0 },
    second: { ok: false, text: "UnsupportedFeatureError: idempotency", requests: 0 },
    inbox: 0,
  },
} as const;

type ModeId = keyof typeof modes;

const STEP = 1100;

export function SendTwice() {
  const [modeId, setModeId] = useState<ModeId>("resend");
  const [phase, setPhase] = useState(0); // 0 idle, 1 first sent, 2 second sent
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const started = useRef(false);
  const inView = useInView(root, { threshold: 0.4 });
  const reduced = useReducedMotion();

  const mode = modes[modeId];

  /** Schedules the two sends; callers reset the phase first. */
  const schedule = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);

    timers.current = [
      window.setTimeout(() => setPhase(1), STEP * 0.6),
      window.setTimeout(() => setPhase(2), STEP * 1.8),
    ];
  }, []);

  const replay = (next: ModeId = modeId) => {
    setModeId(next);
    setPhase(0);
    schedule();
  };

  // Plays once when it first scrolls into view.
  useEffect(() => {
    if (!inView || reduced || started.current) return;

    started.current = true;
    schedule();
  }, [inView, reduced, schedule]);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const phaseShown = reduced ? 2 : phase;
  const requests =
    phaseShown === 0 ? 0 : phaseShown === 1 ? mode.first.requests : mode.second.requests;
  const inbox = phaseShown === 0 ? 0 : mode.inbox;

  const rows = [
    { label: "send", result: mode.first, shown: phaseShown >= 1 },
    { label: "retry, same key", result: mode.second, shown: phaseShown >= 2 },
  ];

  return (
    <div ref={root} className="overflow-hidden rounded-xl border border-(--ek-line)">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--ek-line) px-5 py-3">
        <fieldset className="flex flex-wrap gap-1">
          <legend className="sr-only">Provider</legend>
          {(Object.keys(modes) as ModeId[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === modeId}
              onClick={() => replay(id)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-fd-ring",
                id === modeId
                  ? "bg-fd-accent text-fd-foreground"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              <ProviderMark id={id} />
              {modes[id].name}
            </button>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={() => replay()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-(--ek-line-strong) px-3 py-2 text-sm text-fd-foreground transition-colors hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-fd-ring"
        >
          <RotateCcwIcon aria-hidden="true" className="size-3.5" />
          Run again
        </button>
      </div>

      <div className="grid gap-px bg-(--ek-line) md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="flex flex-col gap-3 bg-fd-background p-6">
          <p className="font-mono text-xs text-fd-muted-foreground">
            {'email.send(welcome, { idempotencyKey: "welcome/ada" })'}
          </p>
          <ol className="flex flex-col gap-2" aria-live="polite">
            {rows.map((row, index) => (
              <li
                key={row.label}
                className={cn(
                  "flex items-center gap-4 rounded-lg border px-4 py-3 transition-[opacity,translate,border-color] duration-500 ease-out-expo",
                  row.shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-30",
                  row.shown && !row.result.ok ? "border-ek-fail/50" : "border-(--ek-line)",
                )}
              >
                <span className="w-6 font-mono text-xs text-fd-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <span className="w-28 shrink-0 text-sm text-fd-muted-foreground">{row.label}</span>
                <span
                  className={cn(
                    "font-mono text-xs",
                    !row.shown && "invisible",
                    row.result.ok ? "text-fd-foreground" : "text-ek-fail",
                  )}
                >
                  {row.result.text}
                </span>
              </li>
            ))}
          </ol>
          <p className="pt-1 font-mono text-xs text-fd-muted-foreground">
            {mode.name}: {mode.window}
          </p>
        </div>

        <div className="ek-dotted flex items-center justify-around gap-6 bg-fd-background p-6">
          <Counter label="requests" value={requests} />
          <Counter label="in the inbox" value={inbox} accent />
        </div>
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        key={value}
        className={cn(
          "animate-ek-pop text-6xl font-light tabular-nums",
          accent ? "text-ek-accent" : "text-fd-foreground",
        )}
      >
        {value}
      </span>
      <span className="font-mono text-xs text-fd-muted-foreground">{label}</span>
    </div>
  );
}
