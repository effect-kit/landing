import config from "klarity/oxlint/react";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [config],
  ignorePatterns: ["src/routeTree.gen.ts", ".source/**", ".tanstack/**", ".output/**"],
  rules: {
    // `_splat` is TanStack Router's catch-all param name.
    "no-underscore-dangle": ["error", { allow: ["_tag", "_splat"] }],
  },
});
