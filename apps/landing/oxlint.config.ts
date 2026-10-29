import config from "klarity/oxlint/react";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [config],
  ignorePatterns: [
    "src/routeTree.gen.ts",
    ".source/**",
    ".tanstack/**",
    ".output/**",
    "src/components/iso/iso-kit.ts",
    "src/components/iso/react/**",
  ],
  rules: {
    // `_splat` is TanStack Router's catch-all param name.
    "no-underscore-dangle": ["error", { allow: ["_tag", "_splat"] }],
    // Inline handlers and style objects are idiomatic here; nothing is memoized behind them.
    "react-perf/jsx-no-new-function-as-prop": "off",
    "react-perf/jsx-no-new-object-as-prop": "off",
    "react-perf/jsx-no-new-array-as-prop": "off",
    "react-perf/jsx-no-jsx-as-prop": "off",
  },
  overrides: [
    {
      // Anatomy figures index precomputed, fixed-length geometry arrays that never reorder.
      files: ["src/features/figures/**"],
      rules: {
        "typescript/no-non-null-assertion": "off",
        "react/no-array-index-key": "off",
      },
    },
  ],
});
