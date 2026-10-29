import type { ComponentType } from "react";

import { EmailsLogo, type LogoProps, RedisLogo, StorageLogo } from "@/components/logos";

import { docsRoute } from "./shared";

export interface PackageInfo {
  /** Root folder under `content/docs`, also the URL segment and search tag. */
  readonly slug: string;
  readonly name: string;
  readonly Logo: ComponentType<LogoProps>;
  /** Whether `content/docs/<slug>` exists yet. */
  readonly hasDocs: boolean;
  /** Marketing page, once the package has one. */
  readonly page?: "/redis" | "/emails";
}

export const packages: readonly PackageInfo[] = [
  {
    slug: "redis",
    name: "Redis",
    Logo: RedisLogo,
    hasDocs: true,
    page: "/redis",
  },
  {
    slug: "emails",
    name: "Emails",
    Logo: EmailsLogo,
    hasDocs: true,
    page: "/emails",
  },
  {
    slug: "storage",
    name: "Storage",
    Logo: StorageLogo,
    hasDocs: false,
  },
];

export const documentedPackages = packages.filter((pkg) => pkg.hasDocs);

export function getPackage(slug: string | undefined): PackageInfo | undefined {
  return packages.find((pkg) => pkg.slug === slug);
}

/** Resolve the package from a docs URL such as `/docs/redis/commands`. */
export function getPackageFromUrl(url: string): PackageInfo | undefined {
  if (!url.startsWith(`${docsRoute}/`)) return undefined;

  return getPackage(url.slice(docsRoute.length + 1).split("/")[0]);
}
