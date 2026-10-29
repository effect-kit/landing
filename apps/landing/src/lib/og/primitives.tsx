import { type BrandKey, brands } from "@/components/brands/data";

/** Shared pieces for the Open Graph images: size, colours, logo glyphs and isometric maths. */

export const OG = { width: 1200, height: 630 } as const;

export const accents = {
  kit: "#6b9bff",
  redis: "#ff6461",
  emails: "#ffc24b",
  storage: "#a78bfa",
} as const;

export type Accent = keyof typeof accents;

export const INK = "#fafafa";
export const MUTED = "#a1a1aa";
export const FAINT = "#52525b";
export const LINE = "rgba(250,250,250,0.10)";
export const BG = "#09090b";

export const KIT_GLYPH = "M53 65h82l-17 17H53zM79.5 90H151l-17 17H79.5zM53 115.5h82l-17 17H53z";
export const glyphs = {
  redis: {
    viewBox: "291 281 660 660",
    d: "M501 405h411L759 539H337zM444 575h324l41-35h120L764 679H319zM429 715h345l45-38h119L775 816H314z",
  },
  emails: {
    viewBox: "209 190 840 840",
    d: "M232 473h336l-78 76H232zM292 582h276l-78 76H292zM608 486h419L747 661 550 543zM354 694h148l85-79 159 93 275-162v141l-88 83H354z",
  },
} as const;
export const PACKAGE_GLYPHS: Record<string, { viewBox: string; d: string } | undefined> = glyphs;

/* ---------------------------------------------------------------- isometric maths */

export const COS = 0.866;
export const SIN = 0.5;
export type P = readonly [number, number];
export const iso =
  (cx: number, cy: number) =>
  (u: number, v: number, z: number): P => [cx + (u - v) * COS, cy + (u + v) * SIN - z];
export const poly = (points: readonly P[]) =>
  `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;

export function boxFaces(
  at: ReturnType<typeof iso>,
  u: number,
  v: number,
  z: number,
  w: number,
  d: number,
  h: number,
) {
  return {
    top: poly([at(u, v, z + h), at(u + w, v, z + h), at(u + w, v + d, z + h), at(u, v + d, z + h)]),
    left: poly([
      at(u, v + d, z + h),
      at(u + w, v + d, z + h),
      at(u + w, v + d, z),
      at(u, v + d, z),
    ]),
    right: poly([
      at(u + w, v, z + h),
      at(u + w, v + d, z + h),
      at(u + w, v + d, z),
      at(u + w, v, z),
    ]),
  };
}

/** A brand mark as SVG paths, placed at (x, y) with the given size, for use inside an SVG. */
export function mark(
  brand: BrandKey,
  x: number,
  y: number,
  size: number,
  color: string,
  transform?: string,
) {
  const data = brands[brand];

  const [vx, vy, vw, vh] = data.viewBox.split(/\s+/).map(Number) as [
    number,
    number,
    number,
    number,
  ];
  const scale = size / Math.max(vw, vh);

  return (
    <g
      transform={`${transform ?? ""} translate(${x} ${y}) scale(${scale}) translate(${-vx} ${-vy})`}
      fill={color}
    >
      {data.paths.map((path) => (
        <path
          key={path.d.slice(0, 20)}
          d={path.d}
          fillRule={"fillRule" in path ? path.fillRule : undefined}
          opacity={"opacity" in path ? path.opacity : undefined}
        />
      ))}
    </g>
  );
}
