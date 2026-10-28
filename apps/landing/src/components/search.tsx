import { useLocation } from "@tanstack/react-router";

import type { SharedProps } from "fumadocs-ui/components/dialog/search";
import DefaultSearchDialog from "fumadocs-ui/components/dialog/search-default";

import { documentedPackages, getPackageFromUrl } from "@/lib/packages";

const tags = documentedPackages.map((pkg) => ({ name: pkg.name, value: pkg.slug }));

/**
 * Search scoped to the package being read; readers can widen it to all packages.
 * Outside a package (e.g. the home page) every package is searched.
 */
export default function PackageSearchDialog(props: SharedProps) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const current = getPackageFromUrl(pathname)?.slug;

  return (
    <DefaultSearchDialog
      {...props}
      {...(current ? { defaultTag: current } : {})}
      tags={tags}
      allowClear
    />
  );
}
