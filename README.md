# Effect Kit Landing

The website and documentation for [Effect Kit](https://effectkit.dev): composable tools for
[Effect](https://effect.website).

The site lives in `apps/landing`. It is a [TanStack Start](https://tanstack.com/start) app with
[Fumadocs](https://fumadocs.dev) for the docs, Tailwind CSS 4 and Effect 4.

## Development

Requires Node.js `24.22.0` (see `.node-version`) and pnpm `12`.

```sh
pnpm install
pnpm dev     # http://localhost:3000
pnpm check   # format, lint, typecheck, test and build
```

| Script           | Description                                    |
| ---------------- | ---------------------------------------------- |
| `pnpm dev`       | Start the dev server.                          |
| `pnpm build`     | Build the site.                                |
| `pnpm check`     | Format check, lint, typecheck, test and build. |
| `pnpm format`    | Format with oxfmt.                             |
| `pnpm lint`      | Lint with oxlint.                              |
| `pnpm typecheck` | Typecheck the root config files and every app. |

Docs pages are MDX files in `apps/landing/content/docs/<package>/`.

### Blog posts

Each post is one MDX file in `apps/landing/content/blog/`; the file name is the slug
(`redis-0-1-1.mdx` is `/blog/redis-0-1-1`). The frontmatter schema, with the allowed tags and
categories, is in `apps/landing/src/lib/blog/schema.ts`, and authors are in
`apps/landing/src/lib/blog/authors.ts`. A wrong tag, category or author fails the build.

```yaml
---
title: "Redis 0.1.1: batches and compiled plans"
description: One or two sentences, 50 to 160 characters, for cards and search results.
published: 2026-10-30
authors: [vedant]
category: release # announcement | release | guide | engineering
tags: [release, redis]
package: redis # optional: the post's accent and docs link
playground: [redis, emails] # optional: enables <Playground /> in the post
cover: # optional: without it the post gets a drawn cover
  src: blog/redis-0-1-1/cover.webp
  alt: What the image shows
  width: 2400
  height: 1260
---
```

Images are WebP keys on `https://cdn.effectkit.dev` (an R2 bucket), never full URLs. A post's
assets live under `blog/<slug>/`: `cover.webp` (2400 × 1260, shown at 1200 × 630), an optional
`og.webp` that overrides the generated Open Graph image, and numbered images `1.webp`, `2.webp`…
Avatars live under `authors/`. `draft: true` shows a post in development only.

Besides the docs components, posts can use `<PostImage n={1} alt="…" width={…} height={…} />`
for `blog/<slug>/1.webp`, the interactive figures `<RedisWrite />`, `<EmailsGate />` and
`<SwapLayer />` (each takes a `caption`), and `<Playground />` with `playground` set in the
frontmatter.

## Deployment

The site deploys to Vercel. Nitro detects Vercel during the build and writes the Build Output
API format; pages and the sitemap are prerendered, and Open Graph images and search run on the
server.

In the Vercel project:

- **Root Directory:** `apps/landing`. Install and build commands come from `vercel.json`.
- **Environment variables:**
  - `ENABLE_EXPERIMENTAL_COREPACK=1`, so Vercel uses the pnpm version in `packageManager`.
  - `VERCEL_DEEP_CLONE=true`, so docs pages get their modified date from git history.
  - `VITE_SITE_URL` (optional), to override the `https://effectkit.dev` origin on previews.
  - `VITE_POSTHOG_KEY`, the PostHog project key. Analytics is off without it, and only runs on
    effectkit.dev. Locally it lives in `apps/landing/.env.local`.
  - `POSTHOG_PERSONAL_API_KEY` (optional, build only), to upload source maps to PostHog error
    tracking.
  - `GITHUB_TOKEN` (optional), a token with no scopes, so the docs changelogs (read from each
    package's GitHub releases) are not held to the 60 requests an hour GitHub allows without one.

## License

[Apache-2.0](./LICENSE) © 2026 Effect Kit Contributors
