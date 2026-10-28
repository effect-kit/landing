import type { ComponentType } from "react";

import type { GetLayoutTabsOptions } from "fumadocs-ui/layouts/shared";

import { EmailsLogo, type LogoProps, RedisLogo } from "@/components/logos";

import { docsRoute } from "./shared";

/** Logo shown in the docs picker for each package, keyed by its root folder. */
const logos: Record<string, ComponentType<LogoProps>> = {
  redis: RedisLogo,
  emails: EmailsLogo,
};

export const tabs: GetLayoutTabsOptions = {
  transform: (option) => {
    const folder = option.url.slice(docsRoute.length + 1).split("/")[0] ?? "";
    const Logo = logos[folder];
    if (!Logo) return option;

    return {
      ...option,
      icon: <Logo variant="badge" className="size-full rounded-md ring-1 ring-fd-border" />,
    };
  },
};
