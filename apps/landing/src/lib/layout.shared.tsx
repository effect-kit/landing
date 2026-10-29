import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { EffectKitLogo } from "@/components/logos";

import type { PackageInfo } from "./packages";
import { appName, gitConfig } from "./shared";

/**
 * Shared layout options. Pass the active package on docs pages to brand the nav
 * with its logo and name.
 */
export function baseOptions(pkg?: PackageInfo): BaseLayoutProps {
  const Logo = pkg?.Logo ?? EffectKitLogo;

  return {
    nav: {
      title: (
        <>
          <Logo className={pkg ? "size-6 text-ek-accent" : "size-6"} />
          <span className="font-semibold">
            {appName}
            {pkg ? (
              <span className="ms-1.5 font-medium text-fd-muted-foreground">{pkg.name}</span>
            ) : null}
          </span>
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}`,
  };
}
