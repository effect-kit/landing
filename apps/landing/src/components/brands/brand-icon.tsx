import type { SVGProps } from "react";

import { type BrandKey, brands } from "./data";

export interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  readonly brand: BrandKey;
  /** Accessible name; defaults to the brand name. Pass `""` for decorative use. */
  readonly label?: string;
}

export function BrandIcon({ brand, label, ...props }: BrandIconProps) {
  const mark = brands[brand];
  const name = label ?? mark.name;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={mark.viewBox}
      fill="currentColor"
      role={name ? "img" : undefined}
      aria-hidden={name ? undefined : true}
      {...props}
    >
      {name ? <title>{name}</title> : null}
      {mark.paths.map((path) => (
        <path
          key={path.d.slice(0, 24)}
          d={path.d}
          fillRule={"fillRule" in path ? path.fillRule : undefined}
          opacity={"opacity" in path ? path.opacity : undefined}
        />
      ))}
    </svg>
  );
}
