# Effect Kit Landing

The landing page for [Effect Kit](https://github.com/effect-kit): composable, open-source tooling for [Effect](https://effect.website).

## Development

Requires Node.js `24.22.0` (see `.node-version`) and pnpm `12`.

```sh
pnpm install
pnpm check
```

| Script           | Description                                       |
| ---------------- | ------------------------------------------------- |
| `pnpm dev`       | Run every workspace `dev` task through Turborepo. |
| `pnpm build`     | Build every workspace.                            |
| `pnpm check`     | Format check, lint, typecheck, test, and build.   |
| `pnpm format`    | Format the repository with oxfmt.                 |
| `pnpm lint`      | Lint the repository with oxlint.                  |
| `pnpm typecheck` | Typecheck root config files and every workspace.  |

Shared tooling configuration (TypeScript, oxlint, oxfmt, lefthook, commitlint, Turborepo) comes from [`klarity`](https://www.npmjs.com/package/klarity). Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org).

## License

[Apache-2.0](./LICENSE) © 2026 Effect Kit Contributors
