import { useId } from "react";

import { BrandIcon } from "@/components/brands/brand-icon";
import type { BrandKey } from "@/components/brands/data";

/**
 * Backends and runtimes from the Redis package's compatibility table. Garnet and Apache
 * Kvrocks only publish raster logos, so they are drawn from alpha masks in `public/brands`.
 */
export type EngineMarkSource = { readonly brand: BrandKey } | { readonly mask: string };

export interface Engine {
  readonly name: string;
  readonly mark: EngineMarkSource;
}

export const engines: readonly Engine[] = [
  { name: "Redis", mark: { brand: "redis" } },
  { name: "Valkey", mark: { brand: "valkey" } },
  { name: "Dragonfly", mark: { brand: "dragonfly" } },
  { name: "KeyDB", mark: { brand: "keydb" } },
  { name: "Redict", mark: { brand: "redict" } },
  { name: "Garnet", mark: { mask: "/brands/garnet.png" } },
  { name: "Apache Kvrocks", mark: { mask: "/brands/kvrocks.png" } },
  { name: "Upstash", mark: { brand: "upstash" } },
];

export const hosted: readonly Engine[] = [
  { name: "Redis Cloud", mark: { brand: "redis" } },
  { name: "Aiven Valkey", mark: { brand: "aiven" } },
];

export const runtimes: readonly Engine[] = [
  { name: "Node.js", mark: { brand: "node" } },
  { name: "Bun", mark: { brand: "bun" } },
  { name: "Deno", mark: { brand: "deno" } },
  { name: "Cloudflare Workers", mark: { brand: "workers" } },
];

/** A monochrome mark in `currentColor`, usable inside another SVG (x, y, size). */
export function EngineMark({
  mark,
  x = 0,
  y = 0,
  size,
  className,
}: {
  readonly mark: EngineMarkSource;
  readonly x?: number;
  readonly y?: number;
  readonly size: number;
  readonly className?: string;
}) {
  const id = useId();

  if ("brand" in mark) {
    return (
      <BrandIcon
        brand={mark.brand}
        label=""
        x={x}
        y={y}
        width={size}
        height={size}
        className={className}
      />
    );
  }

  return (
    <g className={className}>
      <mask id={id} style={{ maskType: "alpha" }}>
        <image href={mark.mask} x={x} y={y} width={size} height={size} />
      </mask>
      <rect x={x} y={y} width={size} height={size} fill="currentColor" mask={`url(#${id})`} />
    </g>
  );
}

/** Standalone icon for HTML layouts. */
export function EngineIcon({
  mark,
  className,
}: {
  readonly mark: EngineMarkSource;
  readonly className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <EngineMark mark={mark} size={24} />
    </svg>
  );
}
