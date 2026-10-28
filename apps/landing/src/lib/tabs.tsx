import type { GetLayoutTabsOptions } from "fumadocs-ui/layouts/shared";

import { getPackageFromUrl } from "./packages";

export const tabs: GetLayoutTabsOptions = {
  transform: (option) => {
    const pkg = getPackageFromUrl(option.url);
    if (!pkg) return option;

    return {
      ...option,
      icon: <pkg.Logo className="size-full" />,
    };
  },
};
