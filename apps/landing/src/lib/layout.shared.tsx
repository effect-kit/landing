import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { GitHubIcon } from "@/components/icons/github-icon";
import { EffectKitLogo } from "@/components/logos";

import { getRepoUrl, type PackageInfo } from "./packages";
import { appName, gitConfig } from "./shared";

/**
 * Shared layout options. Pass the active package on docs pages to brand the nav
 * with its logo and name, and to link its repository from the sidebar.
 */
export function baseOptions(pkg?: PackageInfo): BaseLayoutProps {
  const Logo = pkg?.Logo ?? EffectKitLogo;

  return {
    nav: {
      title: (
        <>
          <Logo className="size-6" />
          <span className="font-semibold tracking-tight">
            {appName}
            {pkg ? <span className="ms-1.5 text-fd-muted-foreground">{pkg.name}</span> : null}
          </span>
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}`,
    links: pkg
      ? [
          {
            type: "main",
            on: "menu",
            text: "GitHub",
            url: getRepoUrl(pkg),
            icon: <GitHubIcon />,
            external: true,
          },
        ]
      : [],
  };
}
