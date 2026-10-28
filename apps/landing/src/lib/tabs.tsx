import type { GetLayoutTabsOptions } from "fumadocs-ui/layouts/shared";

import { docsRoute } from "./shared";

/** Accent colour for each package's icon in the docs picker, keyed by root folder. */
const accents: Record<string, string> = {
  redis: "text-red-400",
  emails: "text-sky-400",
};

const fallbackAccent = "text-fd-primary";

export const tabs: GetLayoutTabsOptions = {
  transform: (option, node) => {
    if (!node.icon) return option;

    const folder = option.url.slice(docsRoute.length + 1).split("/")[0] ?? "";
    const accent = accents[folder] ?? fallbackAccent;

    return {
      ...option,
      icon: (
        <div
          className={`size-full rounded-md border bg-fd-secondary p-1.5 md:p-0.5 [&_svg]:size-full ${accent}`}
        >
          {node.icon}
        </div>
      ),
    };
  },
};
