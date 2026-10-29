import { useEffect, useId, useRef, useState } from "react";

import { track } from "@/lib/analytics/client";
import { cn } from "@/lib/cn";

import { keySlot, SLOTS } from "./key-slot";

/**
 * Redis Cluster as a ring of 16,384 hash slots, split across three primaries. Each key is
 * placed at its real CRC16 slot; a hash tag `{...}` makes two keys share one slot. When they
 * don't, a command that needs both is rejected before it is sent.
 */

const CX = 230;
const CY = 230;
const R = 170;

const nodes = [
  { name: "node a", from: 0, to: 5460 },
  { name: "node b", from: 5461, to: 10922 },
  { name: "node c", from: 10923, to: 16383 },
] as const;

const nodeOf = (slot: number) => nodes.findIndex((node) => slot >= node.from && slot <= node.to);

/** Angle in degrees, 0 at the top, clockwise. */
const angleOf = (slot: number) => (slot / SLOTS) * 360;

const point = (angle: number, radius: number) => {
  const rad = ((angle - 90) * Math.PI) / 180;

  return [CX + Math.cos(rad) * radius, CY + Math.sin(rad) * radius] as const;
};

function arc(from: number, to: number, radius: number) {
  const [x1, y1] = point(angleOf(from) + 1.2, radius);
  const [x2, y2] = point(angleOf(to) - 1.2, radius);
  const large = angleOf(to) - angleOf(from) > 180 ? 1 : 0;

  return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${radius} ${radius} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

const presets = [
  { label: "different slots", a: "user:1000:name", b: "user:1000:email" },
  { label: "hash tag", a: "{user:1000}:name", b: "{user:1000}:email" },
] as const;

function Marker({ slot, label, tone }: { slot: number; label: string; tone: "a" | "b" }) {
  const angle = angleOf(slot);
  const [lx, ly] = point(angle, R + 46);

  return (
    <g>
      <g
        className="ek-ring-marker"
        data-tone={tone}
        style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${CX}px ${CY}px` }}
      >
        <path d={`M${CX} ${CY}V${CY - R + 10}`} className="ek-ring-ray" />
        <circle cx={CX} cy={CY - R} r={7} className="ek-ring-dot" />
      </g>
      <text
        x={lx}
        y={ly + 4}
        textAnchor="middle"
        className="ek-ring-label font-mono text-[12px]"
        data-tone={tone}
      >
        {label} {slot}
      </text>
    </g>
  );
}

function KeyField({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tone: "a" | "b";
}) {
  const id = useId();
  const slot = keySlot(value);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 font-mono text-xs text-fd-muted-foreground"
      >
        <span
          className={cn("size-2 rounded-full", tone === "a" ? "bg-ek-accent" : "bg-fd-foreground")}
        />
        {label}
      </label>
      <div className="flex items-center rounded-md border border-(--ek-line-strong) bg-fd-background focus-within:border-fd-ring">
        <input
          id={id}
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-fd-foreground outline-none"
        />
        <span className="border-s border-(--ek-line) px-3 font-mono text-xs text-fd-muted-foreground tabular-nums">
          slot {slot}
        </span>
      </div>
    </div>
  );
}

const HASH_TAG = /\{[^}]+\}/;
const TYPING_MS = 600;

const clusterState = (a: string, b: string) => ({
  same_slot: keySlot(a) === keySlot(b),
  has_hash_tag: HASH_TAG.test(a) || HASH_TAG.test(b),
});

export function ClusterRing() {
  const [a, setA] = useState<string>(presets[0].a);
  const [b, setB] = useState<string>(presets[0].b);

  const slotA = keySlot(a);
  const slotB = keySlot(b);
  const same = slotA === slotB;
  const nodeA = nodeOf(slotA);
  const nodeB = nodeOf(slotB);
  const typed = useRef(false);

  // Only the outcome is sent, never the keys, and only once typing settles.
  useEffect(() => {
    if (!typed.current) return;

    const timer = window.setTimeout(() => {
      typed.current = false;
      track("cluster_keys_changed", { ...clusterState(a, b), via: "typed" });
    }, TYPING_MS);

    return () => window.clearTimeout(timer);
  }, [a, b]);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="ek-dotted relative mx-auto w-full max-w-[520px]">
        <svg viewBox="0 0 460 460" className="h-auto w-full" aria-labelledby="ring-title">
          <title id="ring-title">
            {`Hash slot ring. ${a} is slot ${slotA} on ${nodes[nodeA]?.name}. ${b} is slot ${slotB} on ${nodes[nodeB]?.name}.`}
          </title>
          <circle cx={CX} cy={CY} r={R} className="ek-ring-track" />
          {Array.from({ length: 64 }, (_, index) => {
            const angle = (index / 64) * 360;
            const [x1, y1] = point(angle, R - 12);
            const [x2, y2] = point(angle, R - (index % 8 === 0 ? 22 : 16));

            return <path key={angle} d={`M${x1} ${y1}L${x2} ${y2}`} className="ek-ring-tick" />;
          })}
          {nodes.map((node, index) => {
            const lit = index === nodeA || index === nodeB;
            const mid = (angleOf(node.from) + angleOf(node.to)) / 2;
            const [nx, ny] = point(mid, R - 52);

            return (
              <g key={node.name} className={cn("ek-ring-node", lit && "is-lit")}>
                <path d={arc(node.from, node.to, R)} className="ek-ring-arc" />
                <text
                  x={nx}
                  y={ny}
                  textAnchor="middle"
                  className="ek-ring-node-label font-mono text-[12px]"
                >
                  {node.name}
                </text>
                <text
                  x={nx}
                  y={ny + 16}
                  textAnchor="middle"
                  className="ek-ring-range font-mono text-[10px]"
                >
                  {node.from}–{node.to}
                </text>
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={34} className="ek-ring-core" />
          <text
            x={CX}
            y={CY + 4}
            textAnchor="middle"
            className="ek-ring-core-label font-mono text-[11px]"
          >
            client
          </text>
          <Marker slot={slotB} label="b" tone="b" />
          <Marker slot={slotA} label="a" tone="a" />
        </svg>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const selected = preset.a === a && preset.b === b;

            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  typed.current = false;
                  track("cluster_keys_changed", {
                    ...clusterState(preset.a, preset.b),
                    via: "preset",
                  });
                  setA(preset.a);
                  setB(preset.b);
                }}
                className={cn(
                  "cursor-pointer rounded-md border px-3 py-1.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-fd-ring",
                  selected
                    ? "border-ek-accent/60 text-fd-foreground"
                    : "border-(--ek-line-strong) text-fd-muted-foreground hover:text-fd-foreground",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <KeyField
          label="key a"
          value={a}
          onChange={(value) => {
            typed.current = true;
            setA(value);
          }}
          tone="a"
        />
        <KeyField
          label="key b"
          value={b}
          onChange={(value) => {
            typed.current = true;
            setB(value);
          }}
          tone="b"
        />
        <div
          aria-live="polite"
          className={cn(
            "rounded-lg border p-4 text-sm",
            same ? "border-ek-accent/40 bg-ek-accent/5" : "border-(--ek-line-strong)",
          )}
        >
          {same ? (
            <p>
              <span className="font-medium text-fd-foreground">Same slot.</span>{" "}
              <span className="text-fd-muted-foreground">
                MGET, transactions and scripts can use both keys.
              </span>
            </p>
          ) : (
            <p>
              <span className="font-medium text-fd-foreground">Different slots.</span>{" "}
              <span className="text-fd-muted-foreground">
                A command that needs both fails with{" "}
                <code className="font-mono text-fd-foreground">ClusterError</code>{" "}
                <code className="font-mono text-fd-foreground">cross-slot</code> before it is sent.
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
