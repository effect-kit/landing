import type { SVGProps } from "react";

export const logoColors = {
  background: "#070707",
  foreground: "#f8f8f8",
} as const;

export type LogoVariant = "mark" | "badge";

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /**
   * `mark` draws only the glyph in `currentColor` on a transparent background.
   * `badge` draws the glyph on the brand's black square.
   *
   * @defaultValue "mark"
   */
  readonly variant?: LogoVariant;
  /** Accessible name. Omit for decorative usage. */
  readonly title?: string;
}

interface BrandLogoProps extends LogoProps {
  /** Side length of the square source artboard. */
  readonly size: number;
  /** Square viewBox that frames the glyph tightly for the `mark` variant. */
  readonly markViewBox: string;
  /** SVG path data for the glyph, in artboard coordinates. */
  readonly glyph: string;
}

export function BrandLogo({
  variant = "mark",
  title,
  size,
  markViewBox,
  glyph,
  ...props
}: BrandLogoProps) {
  const isBadge = variant === "badge";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={isBadge ? `0 0 ${size} ${size}` : markViewBox}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {isBadge ? <path fill={logoColors.background} d={`M0 0h${size}v${size}H0z`} /> : null}
      <path fill={isBadge ? logoColors.foreground : "currentColor"} d={glyph} />
    </svg>
  );
}
