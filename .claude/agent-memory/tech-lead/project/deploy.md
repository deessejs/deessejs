---
name: vercel-deploy
description: Vercel deployment pattern for this monorepo's three apps (web, app, docs) — dashboard overrides trump vercel.json, Node floor engines pin, cache-bust quirk on engines.node change
metadata:
  type: project
---

# Vercel deploy — this repo's three apps

`apps/web` (marketing), `apps/app` (authenticated product), and `apps/docs` (Fumadocs) are deployed as **three separate Vercel projects** from one monorepo. Vercel detects the Next.js framework per app automatically.

## Per-app configuration

| App | Vercel project name (suggested) | Build command (auto) | Output dir |
|---|---|---|---|
| `apps/web` | `deessejs-web` | `next build` | `.next` |
| `apps/app` | `deessejs-app` | `next build` | `.next` |
| `apps/docs` | `deessejs-docs` | `next build` (after `fumadocs-mdx`) | `.next` |

The repo root has no `vercel.json`. Each Vercel project is configured to point at its app's directory and use the framework auto-detection. Default behavior works.

## Dashboard settings OVERRIDE vercel.json

Vercel dashboard → Project Settings → Build & Development has fields that **override** any `vercel.json` you commit. If the dashboard defines `buildCommand` or `outputDirectory`, those values win.

→ Editing `vercel.json` is not enough if the dashboard has its own overrides. The build uses the dashboard settings.

**Solution**: align the dashboard with `vercel.json`, OR don't touch the dashboard fields and let auto-detection drive.

## Node.js version

`engines.node` in root `package.json` is `">=22.0.0"`. Vercel uses `engines.node` to override the dashboard Node version for the build, even when the value is a range.

Vercel currently ships Node 22.x LTS by default. `>=20` will resolve to Node 22 in production today, but bumps freely as LTS moves forward.

**Quirk** (verified 2026-07-28): Vercel does NOT bust the build cache when `engines.node` changes ([vercel/vercel#14368](https://github.com/vercel/vercel/issues/14368)). Force a rebuild (empty commit, or `vercel --prod --force`) after bumping.

## `turbo.json` build env

The `build` task declares the env it expects:

- `DATABASE_URL`, `TEST_DATABASE_URL`
- `BETTER_AUTH_SECRET`, `AUTH_SECRET` (alias), `BETTER_AUTH_URL`, `ALLOWED_ORIGINS`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`, `MAIL_TRANSPORT`
- `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_DESCRIPTION`, `NEXT_PUBLIC_APP_URL`

These apply globally — `apps/docs` and `apps/web` will need them at build time even though they don't consume most of them. Plan accordingly when you split Vercel projects.

## Cross-app linking

`apps/web/src/components/headers/site-header.tsx` links `/login`, `/signup`, and `/docs` as **bare relative paths**. There is no `NEXT_PUBLIC_APP_URL` env wiring in `apps/web`. All three apps must be served under the same domain (Vercel rewrites or a reverse proxy), or you must inject an env var into `packages/ui/src/lib/config.ts` and read `APP_URL` instead.

## Sources

- [Vercel — Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) — engines.node override behavior
- [Build Output API](https://vercel.com/docs/build-output-api/configuration) — outputDirectory is resolved from project root
- Bug cache: [vercel/vercel#14368](https://github.com/vercel/vercel/issues/14368) — engines.node change does not bust cache

Related: [[stack]] (pnpm + Turbo + catalogs that Vercel builds), [[vercel-platform]] (the broader Vercel product surface).