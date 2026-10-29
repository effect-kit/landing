import { type BrandKey, brands } from "@/components/brands/data";

import {
  type Accent,
  accents,
  BG,
  boxFaces,
  COS,
  glyphs,
  iso,
  KIT_GLYPH,
  mark,
  PACKAGE_GLYPHS,
  SIN,
} from "./primitives";

/** Illustrations drawn on the right of each image, as plain SVG so Takumi can rasterize them. */

/** Three slanted plates like the logo, the top one carrying a mark: the "layer" motif. */
export function PlateStack({ accent, slug }: { accent: Accent; slug?: string }) {
  const color = accents[accent];
  const at = iso(300, 210);
  const plates = [0, 1, 2].map((index) => boxFaces(at, 0, 0, index * 58, 200, 200, 16));

  return (
    <svg width={600} height={630} viewBox="0 0 600 630">
      {plates.map((faces, index) => {
        const top = index === plates.length - 1;

        return (
          <g key={faces.top}>
            <path
              d={faces.left}
              fill={top ? `${color}33` : "#18181b"}
              stroke={top ? color : "#3f3f46"}
              strokeWidth={1.5}
            />
            <path
              d={faces.right}
              fill={top ? `${color}22` : "#121214"}
              stroke={top ? color : "#3f3f46"}
              strokeWidth={1.5}
            />
            <path
              d={faces.top}
              fill={top ? `${color}1f` : BG}
              stroke={top ? color : "#52525b"}
              strokeWidth={1.5}
            />
          </g>
        );
      })}
      <g transform={`matrix(${COS} ${SIN} ${-COS} ${SIN} 300 ${210 - 2 * 58 - 16})`}>
        {slug && PACKAGE_GLYPHS[slug] ? (
          <svg x={50} y={50} width={100} height={100} viewBox={PACKAGE_GLYPHS[slug].viewBox}>
            <path d={PACKAGE_GLYPHS[slug].d} fill={color} />
          </svg>
        ) : (
          <svg x={50} y={50} width={100} height={100} viewBox="47 44 110 110">
            <path d={KIT_GLYPH} fill={color} />
          </svg>
        )}
      </g>
    </svg>
  );
}

/** Home: the kit as an exploded stack, one plate per package in its colour; Storage is next. */
export function KitStack() {
  const at = iso(300, 448);
  const plates: readonly {
    id: string;
    glyph?: "redis" | "emails";
    brand?: "kit";
    color: string;
    soon?: boolean;
  }[] = [
    { id: "storage", color: "#71717a", soon: true },
    { id: "emails", glyph: "emails", color: accents.emails },
    { id: "redis", glyph: "redis", color: accents.redis },
    { id: "kit", brand: "kit", color: accents.kit },
  ];
  const size = 148;
  const gap = 104;

  return (
    <svg width={600} height={630} viewBox="0 0 600 630">
      {/* Guides from plate to plate, like the layer stack on the site. */}
      {(
        [
          [0, 0],
          [size, 0],
          [0, size],
          [size, size],
        ] as const
      ).map(([u, v]) => {
        const [x1, y1] = at(u, v, 14);
        const [x2, y2] = at(u, v, (plates.length - 1) * gap);
        return (
          <path
            key={`${u}-${v}`}
            d={`M${x1} ${y1}L${x2} ${y2}`}
            stroke="rgba(250,250,250,0.12)"
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        );
      })}
      {plates.map((plate, index) => {
        const z = index * gap;
        const faces = boxFaces(at, 0, 0, z, size, size, 14);
        const dash = plate.soon ? "6 6" : undefined;

        return (
          <g key={plate.id}>
            <path
              d={faces.left}
              fill={plate.soon ? "none" : `${plate.color}30`}
              stroke={plate.color}
              strokeWidth={1.5}
              strokeDasharray={dash}
            />
            <path
              d={faces.right}
              fill={plate.soon ? "none" : `${plate.color}1c`}
              stroke={plate.color}
              strokeWidth={1.5}
              strokeDasharray={dash}
            />
            <path
              d={faces.top}
              fill={plate.soon ? "rgba(9,9,11,0.6)" : `${plate.color}1a`}
              stroke={plate.color}
              strokeWidth={1.5}
              strokeDasharray={dash}
            />
            <g transform={`matrix(${COS} ${SIN} ${-COS} ${SIN} 300 ${448 - z - 14})`}>
              {plate.glyph ? (
                <svg
                  x={size / 2 - 34}
                  y={size / 2 - 34}
                  width={68}
                  height={68}
                  viewBox={glyphs[plate.glyph].viewBox}
                >
                  <path d={glyphs[plate.glyph].d} fill={plate.color} />
                </svg>
              ) : plate.brand ? (
                <svg
                  x={size / 2 - 34}
                  y={size / 2 - 34}
                  width={68}
                  height={68}
                  viewBox="47 44 110 110"
                >
                  <path d={KIT_GLYPH} fill={plate.color} />
                </svg>
              ) : (
                <rect
                  x={size / 2 - 30}
                  y={size / 2 - 30}
                  width={60}
                  height={60}
                  rx={8}
                  fill="none"
                  stroke={plate.color}
                  strokeDasharray="5 5"
                />
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

const railEngines: readonly BrandKey[] = ["redis", "valkey", "dragonfly", "upstash"];

/** Redis: a short rail of servers, each with its logo on top; one is lit. */
export function ServerRail() {
  const color = accents.redis;
  const at = iso(232, 170);
  const step = 84;
  const size = 64;

  return (
    <svg width={600} height={630} viewBox="0 0 600 630">
      {railEngines.map((brand, index) => {
        const u = index * step;
        const v = -index * step + 180;
        const lit = index === 0;

        const base = boxFaces(at, u - 6, v - 6, 0, size + 12, size + 12, 8);
        const body = boxFaces(at, u, v, 8, size, size, 44);
        const stroke = lit ? color : "#52525b";

        const vents = [16, 26, 36].map((z) => {
          const a = at(u + 10, v + size, 8 + z);
          const b = at(u + size - 10, v + size, 8 + z);
          return (
            <path
              key={z}
              d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`}
              stroke={lit ? `${color}aa` : "#3f3f46"}
              strokeWidth={1.2}
            />
          );
        });

        return (
          <g key={brand}>
            <path d={base.left} fill="#18181b" stroke="#3f3f46" strokeWidth={1.2} />
            <path d={base.right} fill="#121214" stroke="#3f3f46" strokeWidth={1.2} />
            <path d={base.top} fill={BG} stroke="#3f3f46" strokeWidth={1.2} />
            <path
              d={body.left}
              fill={lit ? `${color}2a` : "#1c1c1f"}
              stroke={stroke}
              strokeWidth={1.4}
            />
            <path
              d={body.right}
              fill={lit ? `${color}1a` : "#141416"}
              stroke={stroke}
              strokeWidth={1.4}
            />
            <path d={body.top} fill={lit ? `${color}24` : BG} stroke={stroke} strokeWidth={1.4} />
            {vents}
            {mark(
              brand,
              u + size / 2 - 18,
              v + size / 2 - 18,
              36,
              lit ? color : "#a1a1aa",
              `matrix(${COS} ${SIN} ${-COS} ${SIN} 232 ${170 - 52})`,
            )}
          </g>
        );
      })}
    </svg>
  );
}

const holeBrands: readonly (BrandKey | string)[] = [
  "resend",
  "aws",
  "postmark",
  "sendgrid",
  "mailgun",
  "S",
  "azure",
  "brevo",
  "mailtrap",
  "scaleway",
  "mailchimp",
  "plunk",
];

/** Emails: a pigeonhole wall with one hole lit and an envelope going in. */
export function Pigeonholes() {
  const color = accents.emails;
  const cell = 104;
  const gap = 10;
  const x0 = 60;
  const y0 = 110;

  return (
    <svg width={600} height={630} viewBox="0 0 600 630">
      <rect
        x={x0 - 14}
        y={y0 - 14}
        width={4 * cell + 3 * gap + 28}
        height={3 * cell + 2 * gap + 28}
        rx={16}
        fill="#111113"
        stroke="#3f3f46"
        strokeWidth={1.2}
      />
      {holeBrands.map((brand, index) => {
        const x = x0 + (index % 4) * (cell + gap);
        const y = y0 + Math.floor(index / 4) * (cell + gap);

        // The hole the envelope is heading into.
        const lit = index === 6;

        return (
          <g key={brand}>
            <rect
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={8}
              fill={lit ? `${color}24` : "#0d0d0f"}
              stroke={lit ? color : "#3f3f46"}
              strokeWidth={1.4}
            />
            <path
              d={`M${x} ${y}h${cell}l-9 9H${x + 9}v${cell - 18}l-9 9z`}
              fill="rgba(250,250,250,0.05)"
            />
            {brand in brands ? (
              mark(
                brand as BrandKey,
                x + cell / 2 - 19,
                y + cell / 2 - 19,
                38,
                lit ? color : "#a1a1aa",
              )
            ) : (
              <text
                x={x + cell / 2}
                y={y + cell / 2 + 10}
                textAnchor="middle"
                fontSize={28}
                fontFamily="JetBrains Mono"
                fill="#a1a1aa"
              >
                {brand}
              </text>
            )}
          </g>
        );
      })}
      <g
        transform={`translate(${x0 + 2 * (cell + gap) + cell / 2 - 80} ${y0 + cell + gap + 20}) rotate(-10)`}
      >
        <rect x={-34} y={-22} width={68} height={44} rx={4} fill={color} />
        <path d="M-34 -20L0 4L34 -20" fill="none" stroke={BG} strokeWidth={2.5} />
      </g>
    </svg>
  );
}
