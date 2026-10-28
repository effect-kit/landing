import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { EffectKitLogo } from "@/components/logos";

import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <EffectKitLogo className="size-6" />
          <span className="font-semibold tracking-tight">{appName}</span>
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
