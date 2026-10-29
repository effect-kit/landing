import type { ReactNode } from "react";

import { ImageResponse } from "takumi-js/response";

import { getRenderer } from "./fonts";
import { OG } from "./templates";

/** Renders an OG image as PNG, cached hard: the URL changes whenever its input does. */
export async function ogResponse(node: ReactNode) {
  const renderer = await getRenderer();

  return new ImageResponse(node, {
    renderer,
    width: OG.width,
    height: OG.height,
    format: "png",
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
    },
  });
}
