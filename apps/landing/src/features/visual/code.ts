import { createServerFn } from "@tanstack/react-start";

import type { KeyedTokensInfo } from "@shikijs/magic-move/types";

import { getHighlighter } from "@/lib/highlight";

import {
  type VisualCodeKey,
  type VisualExampleId,
  visualSnippetLang,
  visualSnippets,
} from "./snippets";

/** Magic Move tokens for every code variant of the requested examples. */
export type VisualCode = Partial<Record<VisualCodeKey, KeyedTokensInfo>>;

/**
 * Tokenizes the playground snippets on the server with the site's Shiki themes, so the code
 * panel ships tokens and no highlighter runs in the browser. Call it from the route loader:
 * `visualCode({ data: ["redis-retry", "redis-pipeline"] })`.
 */
export const visualCode = createServerFn({ method: "GET" })
  .validator((ids: readonly VisualExampleId[]) => ids)
  .handler(async ({ data: ids }) => {
    const [shiki, { codeToKeyedTokens }] = await Promise.all([
      getHighlighter(),
      import("@shikijs/magic-move/core"),
    ]);

    const result: VisualCode = {};
    for (const id of ids) {
      const variants: Readonly<Record<string, string>> = visualSnippets[id];

      for (const [variant, code] of Object.entries(variants)) {
        result[`${id}:${variant}`] = codeToKeyedTokens(shiki, code, {
          lang: visualSnippetLang(id),
          themes: { light: "effect-kit-light", dark: "effect-kit-dark" },
          defaultColor: false,
        });
      }
    }

    return result;
  });
