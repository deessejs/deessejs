# Preview deployment URL wiring

Operator runbook for ADR-028's `preview-against-preview` wiring across
the three Vercel projects in the monorepo (`apps/web`, `apps/app`,
`apps/internal-documentation`).

This is **not** an incident runbook — it is a one-time setup procedure.
The instructions here run once per project pair, then the preview
URLs follow the link for every subsequent PR.

## Goal

A Vercel preview of `apps/web` on branch `feat/foo` fetches the
corresponding preview of `apps/app` on the same branch for oRPC, auth
callbacks, and email magic links. Without this wiring, every preview
of `apps/web` would default to the production `apps/app` — the bug
ADR-028 §Context §1–§5 documents.

## Prerequisites

- Vercel dashboard access for the `deessejs` team
- The two project IDs (`prj_xxx`) for `apps/web` and `apps/app`.
  Find them under **Settings → General → Project ID** for each project.
- The operator role to edit Vercel env vars for both projects.

## Steps

### 1. Record the project IDs

Open each project's **Settings** page and copy the **Project ID**.

| Project | ID | Notes |
|---|---|---|
| `apps/web` | `prj_EDu0GMa3fKaInW6f3MBiLCiewi6O` | the marketing site |
| `apps/app` | `prj_IOf5cRl1rkbc6SfSMzLsKsneYPdb` | auth + UI + API |

### 2. Edit the two `vercel.json` files

Both files are checked in. Replace `REPLACE_WITH_*_PROJECT_ID` with
the real IDs from step 1.

**`apps/web/vercel.json`:**

```json
{
  "relatedProjects": ["prj_IOf5cRl1rkbc6SfSMzLsKsneYPdb"]
}
```

**`apps/app/vercel.json`:**

```json
{
  "relatedProjects": ["prj_EDu0GMa3fKaInW6f3MBiLCiewi6O"]
}
```

Commit the change in the same PR as this runbook (already done if
you're reading this in the merged PR). The next deployment on each
project auto-injects `VERCEL_RELATED_PROJECTS` populated with the
matched preview and production hosts.

### 3. Verify the link

Push a branch that touches both `apps/web` and `apps/app`. Wait for
both previews to deploy.

From the `apps/web` preview, open DevTools → Network and confirm the
oRPC fetch hits
`https://apps-app-git-<branch>-<scope>.vercel.app/api/v1/rpc/...`
(the linked sibling preview), not `app.deessejs.com`.

If the fetch still hits production, the link is not wired:

1. Confirm `vercel.json` is committed and pushed (check the deploy log
   for the file being read).
2. Confirm the `relatedProjects` ID matches the sibling project's
   actual ID (typo is the most common failure mode).
3. Confirm Turborepo Strict Mode isn't silently dropping
   `VERCEL_RELATED_PROJECTS` — if it is, the variable must be added
   to `turbo.json`'s `globalPassThroughEnv`. ADR-028 Decision #3
   already includes it.

### 4. Smoke-test the cross-app navigation

From the `apps/web` preview:

- Click **Log in** in the header. The navigation target must be
  `https://apps-app-git-<branch>-<scope>.vercel.app/login`.
- Click **Sign up**. Same target.
- View source on `/` and confirm the sitemap link in `robots.txt`
  and the OG image bottom bar advertise `https://deessejs.com`
  (the production marketing canonical — Decision #1 keeps this
  even on a preview).

### 5. Smoke-test the email magic links (optional)

Trigger a password reset from the `apps/app` preview. The email's
`Reset your password` link must point at
`https://apps-app-git-<branch>-<scope>.vercel.app/reset-password?token=...`
(the linked preview). The dynamic `baseURL` block in
`packages/auth/src/auth.ts` (Decision #2 + ADR-021) handles this
automatically once the host is permitted.

## Limitations

- **Database isolation is not part of the preview wiring.** The
  linked previews share the same `DATABASE_URL` Vercel env var. If
  PR-level database isolation is needed, scope a per-branch database
  override in a follow-up ADR (Limitation #1 of ADR-028).
- **Cross-subdomain cookies do not apply to previews.** The
  `deessejs.com` cookie scope from ADR-023 does not match
  `*.vercel.app`. A preview is always logged-out for marketing-page
  session-aware UI, even after signing in on `apps/app` (Limitation
  #2 of ADR-028, also documented in ADR-023 §"Known limitations" §2).
- **CLI deploys are unsupported.** `vercel deploy` from the CLI does
  not honour `relatedProjects`. Production deploys go through Git;
  the constraint is acceptable.

## Related

- ADR-028: Vercel preview URL wiring across web, app, and docs
- [Vercel docs: How to link projects together in a monorepo](https://vercel.com/docs/monorepos#how-to-link-projects-together-in-a-monorepo)
- [`@vercel/related-projects` package source](https://github.com/vercel/vercel/tree/main/packages/related-projects)
- `apps/web/tests/e2e/RUNBOOK.md` — Deployment Protection and
  `VERCEL_AUTOMATION_BYPASS_SECRET` wiring (complementary surface,
  not duplicated here).