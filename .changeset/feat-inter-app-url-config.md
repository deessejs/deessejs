---
"web": patch
"app": patch
"@workspace/env": patch
"@deessejs/cli": patch
---

Implements ADR-021: first-class inter-app URLs in `@workspace/env`,
removing the relative-path construction in three consumers.

User-visible:

- `https://deessejs.com/templates` and
  `https://deessejs.com/templates/[slug]` now render the populated
  catalog and the detail page respectively. Previously, the
  marketing site's oRPC client fetched `/api/v1/rpc/templates/list`
  relative to `deessejs.com`, which does not host the backend (the
  catch-all lives in `apps/app/app/api/[[...route]]/route.ts` on
  `app.deessejs.com`). The marketing site was showing the documented
  empty state and `/templates/[slug]` returned a Next.js 500.
- `npx @deessejs/cli list` (and every other published CLI command)
  now resolves the API host to `https://app.deessejs.com` by
  default, instead of failing because it resolved the URL against
  the user's working directory.

API surface:

- `@workspace/env` gains four server fields (`WEB_URL`, `APP_URL`,
  `DOCS_URL`, `API_BASE_URL`) and four client fields
  (`NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`,
  `NEXT_PUBLIC_DOCS_URL`, `NEXT_PUBLIC_API_BASE_URL`). Defaults are
  localhost ports in dev and the canonical Vercel domains in
  production. A `.refine` rejects trailing slashes at parse time.
- `apps/web/src/lib/orpc.ts` builds the oRPC URL via
  `new URL(API_RPC_PATH, clientEnv.NEXT_PUBLIC_API_BASE_URL)`.
- `apps/app/proxy.ts` builds the auth probe URL via
  `new URL(path, serverEnv.API_BASE_URL)`.
- `apps/cli/src/api/client.ts` and `apps/cli/src/version/check.ts`
  read `process.env.API_BASE_URL` directly (the published tarball
  cannot depend on the private `@workspace/env` package). Override
  via shell env (`API_BASE_URL=https://staging.example.com
  deessejs list`).

Tests:

- New unit suite at `packages/env/tests/unit/schema.urls.test.ts`
  pins the URL contract (defaults parse, production URLs parse,
  trailing slashes rejected, non-URLs rejected).

Vercel env (operational, no code change):

- Production: `API_BASE_URL=https://app.deessejs.com` and the
  `NEXT_PUBLIC_API_BASE_URL` mirror must be set on `apps/web`'s
  Vercel project.
- Production: `ALLOWED_ORIGINS` on `apps/app`'s Vercel project must
  include `https://deessejs.com` for the cross-origin
  no-credentials fetch from the marketing site (cf. ADR-021 §
  Cross-origin considerations).
- Preview deployments: each Vercel preview defaults to
  `https://app.deessejs.com` (the schema default). A future ADR
  covers preview-vs-preview wiring.