import { useEffect, useRef, useState } from "react";

import { CodeWindow } from "@/components/marketing/code";
import { useInView, useReducedMotion } from "@/components/marketing/hooks";
import { MagicCode } from "@/components/marketing/magic-code";
import { type SnippetId, snippets } from "@/content/snippets";
import { track } from "@/lib/analytics/client";
import { cn } from "@/lib/cn";
import type { KeyedSnippets } from "@/lib/magic";

const tour = [
  {
    id: "redis.keys",
    label: "Typed keys",
    line: "Decode on read, encode on write.",
    result: "Option<{ name: string; active: boolean }>",
  },
  {
    id: "redis.pipeline",
    label: "Pipelines",
    line: "One round trip, one result per command.",
    result: "[Result<void>, Result<bigint>]",
  },
  {
    id: "redis.transaction",
    label: "Transactions",
    line: "A WATCH conflict comes back as a value.",
    result: "Committed | Conflict",
  },
  {
    id: "redis.pubsub",
    label: "Pub/Sub",
    line: "Messages arrive as an Effect Stream.",
    result: "Stream<Message>",
  },
  {
    id: "redis.streams",
    label: "Streams",
    line: "Acknowledged only after your handler succeeds.",
    result: "acknowledged after success",
  },
] as const satisfies readonly {
  id: SnippetId;
  label: string;
  line: string;
  result: string;
}[];

export const apiTourSnippetIds: readonly SnippetId[] = tour.map((entry) => entry.id);

const DURATION = 7000;

/**
 * The API in five stops. One code window morphs between them with Magic Move; the list on the
 * left advances on its own while in view; a click jumps to a stop and the tour carries on from there.
 */
export function ApiTour({ tokens }: { readonly tokens: KeyedSnippets }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const inView = useInView(root, { threshold: 0.35 });
  const reduced = useReducedMotion();
  const cause = useRef<"auto" | "click">("auto");
  const reported = useRef(-1);

  // A stop counts once it is on screen, whether the tour advanced or a click picked it.
  useEffect(() => {
    const entry = tour[active];
    if (!inView || !entry || reported.current === active) return;

    reported.current = active;
    track("api_tour_step_viewed", { step_id: entry.id, index: active, cause: cause.current });
    cause.current = "auto";
  }, [active, inView]);

  useEffect(() => {
    bar.current?.style.setProperty("--progress", "0");
    if (!inView || reduced) return;

    let frame = 0;
    const start = performance.now();

    // The bar is driven through a CSS variable so each frame skips a React render.
    const tick = (time: number) => {
      const value = Math.min((time - start) / DURATION, 1);
      bar.current?.style.setProperty("--progress", String(value));

      if (value >= 1) {
        setActive((active + 1) % tour.length);
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [active, inView, reduced]);

  const current = tour[active] ?? tour[0];

  return (
    <div ref={root} className="grid gap-8 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
      <div
        role="tablist"
        aria-label="Redis API"
        aria-orientation="vertical"
        className="flex flex-col"
      >
        {tour.map((entry, index) => {
          const selected = index === active;

          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                // Picking a tab restarts its timer; the tour carries on from there.
                if (index !== active) cause.current = "click";
                setActive(index);
              }}
              className={cn(
                "relative cursor-pointer border-t border-(--ek-line) py-4 text-start transition-colors last:border-b focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fd-ring",
                selected
                  ? "text-fd-foreground"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              <span className="block text-lg font-light">{entry.label}</span>
              <span
                className={cn(
                  "block text-sm text-fd-muted-foreground transition-opacity",
                  selected ? "opacity-100" : "opacity-0",
                )}
              >
                {entry.line}
              </span>
              {selected && !reduced ? (
                <span
                  ref={bar}
                  aria-hidden="true"
                  className="absolute -top-px left-0 h-px w-full origin-left scale-x-(--progress) bg-ek-accent"
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <CodeWindow
        code={snippets[current.id].code}
        snippetId={current.id}
        className="min-w-0 self-start"
      >
        <MagicCode tokens={tokens} ids={apiTourSnippetIds} current={current.id} />
        <p className="border-t border-(--ek-line) px-5 py-3 font-mono text-xs text-fd-muted-foreground">
          <span className="text-ek-accent">{"// "}</span>
          {current.result}
        </p>
      </CodeWindow>
    </div>
  );
}
