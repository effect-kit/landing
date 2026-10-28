import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="2.5" y="2.5" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.5" y="9.5" width="12" height="12" rx="3" fill="currentColor" />
    </svg>
  );
}
