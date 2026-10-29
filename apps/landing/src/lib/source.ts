import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";
import { z } from "zod";

import { docsRoute } from "./shared";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    async: true,
    // Git history gives each page a modified date for SEO and the sitemap.
    lastModified: true,
    schema: pageSchema.extend({
      /** Extra search keywords for this page. */
      keywords: z.array(z.string()).optional(),
      /** First publication date, `YYYY-MM-DD`. */
      published: z.iso.date().optional(),
      /** Author shown in article metadata; defaults to the organisation. */
      author: z.string().optional(),
    }),
  },
});

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
  plugins: [lucideIconsPlugin()],
});
