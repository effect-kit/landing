import type { ReactNode } from "react";

import {
  type Accent,
  accents,
  BG,
  FAINT,
  INK,
  KIT_GLYPH,
  MUTED,
  OG,
  PACKAGE_GLYPHS,
} from "./primitives";

/** The frame every image shares: brand and crumb on top, text on the left, art on the right. */

export function KitMark({ size = 34, color = INK }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="47 44 110 110">
      <path d={KIT_GLYPH} fill={color} />
    </svg>
  );
}

export function PackageMark({ slug, size, color }: { slug: string; size: number; color: string }) {
  const glyph = PACKAGE_GLYPHS[slug];
  if (!glyph) return <KitMark size={size} color={color} />;

  return (
    <svg width={size} height={size} viewBox={glyph.viewBox}>
      <path d={glyph.d} fill={color} />
    </svg>
  );
}

export function DotGrid() {
  const dots: ReactNode[] = [];

  for (let y = 15; y < OG.height; y += 30)
    for (let x = 15; x < OG.width; x += 30)
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} fill="rgba(250,250,250,0.07)" />);

  return (
    <svg width={OG.width} height={OG.height} style={{ position: "absolute", top: 0, left: 0 }}>
      {dots}
    </svg>
  );
}

interface FrameProps {
  readonly accent: Accent;
  /** Shown after the brand, e.g. "Redis" or "Docs · Redis". */
  readonly crumb?: string;
  readonly art: ReactNode;
  readonly children: ReactNode;
  /** Narrow the text column when the art reaches into the middle. */
  readonly wide?: boolean;
}

export function Frame({ accent, crumb, art, children, wide = true }: FrameProps) {
  const color = accents[accent];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: OG.width,
        height: OG.height,
        backgroundColor: BG,
        color: INK,
        fontFamily: "Inter",
        overflow: "hidden",
      }}
    >
      <DotGrid />
      <div
        style={{
          position: "absolute",
          right: -160,
          top: -120,
          width: 760,
          height: 760,
          borderRadius: 9999,
          backgroundImage: `radial-gradient(circle, ${color}26 0%, ${color}00 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {art}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: OG.width,
          height: OG.height,
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <KitMark />
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>Effect Kit</span>
          {crumb ? (
            <span
              style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: MUTED }}
            >
              <span style={{ color: FAINT }}>/</span>
              <span style={{ color }}>{crumb}</span>
            </span>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            gap: 22,
            maxWidth: wide ? 640 : 560,
            paddingBottom: 48,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function Title({ children, size = 76 }: { children: ReactNode; size?: number }) {
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 500,
        lineHeight: 1.04,
        letterSpacing: -size * 0.035,
        color: INK,
      }}
    >
      {children}
    </div>
  );
}

export function Description({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 28, lineHeight: 1.4, color: MUTED, fontWeight: 400 }}>{children}</div>
  );
}
