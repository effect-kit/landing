import { defineConfig } from "fumadocs-mdx/config";

import { effectKitDark, effectKitLight } from "./src/themes/code";

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: effectKitLight,
        dark: effectKitDark,
      },
    },
  },
});
