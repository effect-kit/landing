# Working on the Effect Kit landing site

## Before changing code

- Check `git status --short` and recent commits; keep unrelated work out of your change.
- The app is `apps/landing`. Run `pnpm check` from the root before you finish; it must pass.
- Commit on `main` with Conventional Commits, scope `landing`. Don't push without permission.

## Stack

- TanStack Start (file routes in `src/routes`, `routeTree.gen.ts` is generated), React 19,
  Tailwind CSS 4, Fumadocs with Base UI, Effect 4, Nitro for the server build.
- TypeScript is strict, including `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
  Lint with oxlint (`--deny-warnings`) and format with oxfmt.
- The pnpm catalog in `pnpm-workspace.yaml` holds only workspace tooling and packages shared
  across workspaces. Add app-only dependencies to the app's `package.json` with an exact
  version. Commit the lockfile.

## Layout

- `src/features/<page>`: one folder per landing page (`home`, `redis`, `emails`), the
  playground (`visual`) and the isometric figures (`figures`).
- `src/components/marketing`: shared sections, nav, footer, code blocks and hooks.
- `src/components/iso`: the vendored anatomy kit. Don't edit it; lint and format skip it.
- `src/lib`: SEO (`seo.ts`, `site.ts`), OG images (`og/`), highlighting and the docs source.
- `src/content`: code snippets and email provider capabilities shown on the pages.
- `src/styles`: `app.css` plus one stylesheet per page.

## Content rules

- Everything the site claims about the packages must match their source
  (`effect-kit/redis`, `effect-kit/emails`, `effect-kit/storage`). Check APIs, error names
  and capabilities before writing copy or snippets; never invent numbers.
- Keep copy short and plain. No em dashes, no marketing buzzwords.
- Agents read the site as Markdown: `/llms.txt`, `/llms-full.txt`, `.md` URLs and
  `Accept: text/markdown`. When a landing page changes, update
  `src/content/landing-markdown.ts` to match; docs Markdown is generated from the MDX.
- Docs code blocks marked `twoslash` compile against the published `@effect-kit/*` packages at
  build time; a type error or a `^?` caret that is not under an identifier fails the build. oxfmt
  reformats code inside MDX, so re-check carets after formatting. The dev server can serve a stale
  page after a broken edit; trust `pnpm build`.
- Each page has one accent (blue for the kit, red for Redis, amber for emails) set with
  `data-accent`. The site is dark only (forced in `__root.tsx`, no theme switch); support phone
  widths and reduced motion.

## Code conventions

- Keep files to one responsibility and under about 500 lines; split at real boundaries.
- Separate logical steps and declarations with blank lines. Comment only on reasons,
  invariants and constraints, not on what the code plainly does.
- Reuse existing components and helpers before adding new ones.
- New pages need a `head` built with `seo()` from `src/lib/seo.ts`, an OG image, and links
  with a `title`.

## Verification

- For visual changes, check the page in a browser at desktop width and at 390px wide.
- The dev server can keep serving stale server code (the Shiki highlighter, OG routes) after
  edits; restart it before trusting what you see.
