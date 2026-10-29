import config from "klarity/oxfmt";

export default {
  ...config,
  ignorePatterns: [
    ...(config.ignorePatterns ?? []),
    "**/routeTree.gen.ts",
    "**/.tanstack/**",
    "**/components/iso/iso-kit.ts",
    "**/components/iso/iso.css",
    "**/components/iso/react/**",
  ],
};
