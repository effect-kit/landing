import { useState } from "react";

import { BrandIcon } from "@/components/brands/brand-icon";
import type { BrandKey } from "@/components/brands/data";
import { CodeWindow } from "@/components/marketing/code";
import { useReducedMotion } from "@/components/marketing/hooks";
import { MagicCode } from "@/components/marketing/magic-code";
import type { SnippetId } from "@/content/snippets";
import { cn } from "@/lib/cn";
import type { KeyedSnippets } from "@/lib/magic";

const runtimes = [
  {
    id: "node",
    name: "Node.js",
    layer: "RedisNode",
    brands: ["node"],
    transport: "socket",
    wire: "TCP, TLS or Unix socket",
  },
  {
    id: "bun",
    name: "Bun",
    layer: "RedisBun",
    brands: ["bun"],
    transport: "socket",
    wire: "Bun TCP socket",
  },
  {
    id: "upstash",
    name: "Deno and Workers",
    layer: "RedisUpstash",
    brands: ["upstash", "deno", "workers"],
    transport: "http",
    wire: "HTTP and SSE, through Upstash",
  },
] as const satisfies readonly {
  id: string;
  name: string;
  layer: string;
  brands: readonly BrandKey[];
  transport: "socket" | "http";
  wire: string;
}[];

type RuntimeId = (typeof runtimes)[number]["id"];

/** From the package README: these need a native socket and are not available over HTTP. */
const features: readonly { label: string; http: "yes" | "no" | "limited" }[] = [
  { label: "Commands", http: "yes" },
  { label: "Pipelines", http: "yes" },
  { label: "Transactions", http: "yes" },
  { label: "Pub/Sub, text", http: "yes" },
  { label: "Binary values", http: "limited" },
  { label: "WATCH", http: "no" },
  { label: "Blocking reads", http: "no" },
  { label: "Client tracking", http: "no" },
  { label: "Cluster", http: "no" },
];

export const runtimeSnippetIds: readonly SnippetId[] = runtimes.map(
  (entry) => `redis.runtime.${entry.id}` as const,
);

/**
 * How the wire works on each runtime: a socket keeps one connection open with traffic both
 * ways, HTTP sends a request and waits for its response.
 */
function Wire({
  transport,
  layer,
}: {
  readonly transport: "socket" | "http";
  readonly layer: string;
}) {
  const reduced = useReducedMotion();

  const y = 70;
  const from = 196;
  const to = 404;

  return (
    <svg viewBox="0 0 560 140" className="h-auto w-full" aria-hidden="true">
      <g className="ek-wire-node">
        <rect x={16} y={y - 30} width={150} height={60} rx={8} />
        <text x={91} y={y - 4} textAnchor="middle" className="font-mono text-[12px]">
          program
        </text>
        <text x={91} y={y + 14} textAnchor="middle" className="ek-wire-sub font-mono text-[10px]">
          yield* Redis
        </text>
      </g>
      <g className="ek-wire-node ek-wire-layer">
        <rect x={166} y={y - 16} width={30} height={32} rx={4} />
      </g>
      <text x={181} y={y - 24} textAnchor="middle" className="ek-wire-accent font-mono text-[10px]">
        {layer}
      </text>
      <g className="ek-wire-node">
        <rect x={to} y={y - 30} width={140} height={60} rx={8} />
        <text x={to + 70} y={y + 4} textAnchor="middle" className="font-mono text-[12px]">
          Redis
        </text>
      </g>

      {transport === "socket" ? (
        <g key="socket">
          <path className="ek-wire-line" d={`M${from} ${y - 6}H${to}M${from} ${y + 6}H${to}`} />
          {reduced
            ? null
            : [0, 0.33, 0.66].map((delay) => (
                <g key={delay}>
                  <circle r={3} cy={y - 6} className="ek-wire-packet">
                    <animate
                      attributeName="cx"
                      from={from}
                      to={to}
                      dur="1.4s"
                      begin={`${delay * 1.4}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r={3} cy={y + 6} className="ek-wire-packet is-back">
                    <animate
                      attributeName="cx"
                      from={to}
                      to={from}
                      dur="1.4s"
                      begin={`${delay * 1.4 + 0.2}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              ))}
          <text
            x={(from + to) / 2}
            y={y + 34}
            textAnchor="middle"
            className="ek-wire-sub font-mono text-[10px]"
          >
            one connection, both directions
          </text>
        </g>
      ) : (
        <g key="http">
          <path className="ek-wire-line" strokeDasharray="4 5" d={`M${from} ${y}H${to}`} />
          {reduced ? null : (
            <>
              <circle r={3.5} cy={y} className="ek-wire-packet">
                <animate
                  attributeName="cx"
                  values={`${from};${to};${to};${to}`}
                  keyTimes="0;0.35;0.5;1"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1;1;0;0"
                  keyTimes="0;0.35;0.36;1"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r={3.5} cy={y} className="ek-wire-packet is-back">
                <animate
                  attributeName="cx"
                  values={`${to};${to};${from};${from}`}
                  keyTimes="0;0.5;0.85;1"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.5;0.85;0.86"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
          <text
            x={(from + to) / 2}
            y={y + 34}
            textAnchor="middle"
            className="ek-wire-sub font-mono text-[10px]"
          >
            request, then response
          </text>
        </g>
      )}
    </svg>
  );
}

/** Runtime picker: the wire redraws, the code morphs, and the capability list updates. */
export function RuntimeSwitch({ tokens }: { readonly tokens: KeyedSnippets }) {
  const [runtimeId, setRuntimeId] = useState<RuntimeId>("node");
  const runtime = runtimes.find((entry) => entry.id === runtimeId) ?? runtimes[0];

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="grid gap-px overflow-hidden rounded-xl border border-(--ek-line) bg-(--ek-line) sm:grid-cols-3">
        <legend className="sr-only">Runtime</legend>
        {runtimes.map((entry) => {
          const selected = entry.id === runtimeId;

          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setRuntimeId(entry.id)}
              className={cn(
                "flex cursor-pointer items-center gap-4 p-5 text-start transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fd-ring",
                selected ? "bg-fd-card" : "bg-fd-background hover:bg-fd-card/60",
              )}
            >
              <span className="flex -space-x-2">
                {entry.brands.map((brand) => (
                  <span
                    key={brand}
                    className={cn(
                      "grid size-11 place-items-center rounded-full border bg-fd-background transition-colors",
                      selected
                        ? "border-ek-accent/60 text-fd-foreground"
                        : "border-(--ek-line-strong) text-fd-muted-foreground",
                    )}
                  >
                    <BrandIcon brand={brand} label="" className="size-5" />
                  </span>
                ))}
              </span>
              <span className="flex flex-col">
                <span className="text-lg font-light">{entry.name}</span>
                <span className="font-mono text-xs text-fd-muted-foreground">{entry.wire}</span>
              </span>
            </button>
          );
        })}
      </fieldset>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col overflow-hidden rounded-xl border border-(--ek-line)">
          <div className="ek-dotted border-b border-(--ek-line) px-4 py-6">
            <Wire transport={runtime.transport} layer={`${runtime.layer}.layer`} />
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 p-5 text-sm sm:grid-cols-3">
            {features.map((feature) => {
              const state = runtime.transport === "http" ? feature.http : "yes";

              return (
                <li
                  key={feature.label}
                  className={cn(
                    "flex items-center gap-2",
                    state === "no"
                      ? "text-fd-muted-foreground/60 line-through"
                      : "text-fd-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      state === "yes" && "bg-ek-accent",
                      state === "limited" && "border border-ek-accent",
                      state === "no" && "bg-(--ek-line-strong)",
                    )}
                  />
                  {feature.label}
                  {state === "limited" ? (
                    <span className="font-mono text-[10px] text-fd-muted-foreground">limited</span>
                  ) : null}
                  <span className="sr-only">{state === "no" ? ", not available" : ""}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <CodeWindow title="program.ts" className="min-w-0 self-start">
          <MagicCode
            tokens={tokens}
            ids={runtimeSnippetIds}
            current={`redis.runtime.${runtime.id}`}
          />
        </CodeWindow>
      </div>
    </div>
  );
}
