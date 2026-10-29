import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { defineConfig } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs";

import { effectKitDark, effectKitLight } from "./src/themes/code";

export default defineConfig({
  mdxOptions: {
    // One package manager choice for every install block on the site.
    remarkNpmOptions: { persist: { id: "package-manager" } },
    rehypeCodeOptions: {
      themes: {
        light: effectKitLight,
        dark: effectKitDark,
      },
      langs: ["ts", "tsx", "js", "jsx"],
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        // Opt in per block with ```ts twoslash. Types resolve against the installed packages at
        // build time, and are cached so rebuilds skip unchanged blocks.
        transformerTwoslash({
          typesCache: createFileSystemTypesCache({ dir: "node_modules/.cache/twoslash" }),
        }),
      ],
    },
  },
});
