import { useState } from "react";

import { useLocation } from "@tanstack/react-router";

import { useDocsSearch } from "fumadocs-core/search/client";
import { fetchClient } from "fumadocs-core/search/client/fetch";
import { useOnChange } from "fumadocs-core/utils/use-on-change";
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
  TagsList,
  TagsListItem,
} from "fumadocs-ui/components/dialog/search";

import { documentedPackages, getPackageFromUrl } from "@/lib/packages";

/**
 * Search scoped to the package being read; readers can widen it to all packages.
 * Outside a package (e.g. the home page) every package is searched.
 *
 * The footer sits inside `SearchDialogContent` so it's portaled with the popup
 * (the stock dialog renders it outside, which leaks it onto the page with Base UI).
 */
export default function PackageSearchDialog(props: SharedProps) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const current = getPackageFromUrl(pathname)?.slug;

  const [tag, setTag] = useState(current);
  useOnChange(current, setTag);

  const search = useDocsSearch({ client: fetchClient(tag === undefined ? {} : { tag }) });

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
        <SearchDialogFooter>
          <TagsList {...(tag === undefined ? {} : { tag })} onTagChange={setTag} allowClear>
            {documentedPackages.map((pkg) => (
              <TagsListItem key={pkg.slug} value={pkg.slug}>
                {pkg.name}
              </TagsListItem>
            ))}
          </TagsList>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
