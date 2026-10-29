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

## License

[Apache-2.0](./LICENSE) © 2026 Effect Kit Contributors
