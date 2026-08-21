# apps/web e2e runbook

This runbook documents the **one-time Vercel + GitHub Actions
configuration** required for the Playwright e2e suite to run
against the deployed preview.

The e2e suite lives at `apps/web/tests/e2e/` per
`ADR-020`. The CI workflows are at
`.github/workflows/apps-web-e2e.yml` and
`apps-web-e2e-extended.yml`. This runbook covers the platform
side that no automation can apply.

## 1. Enable Deployment Protection on the Vercel project

In the Vercel Dashboard for the `deessejs-web` project:

1. Go to **Settings → Deployment Protection**.
2. Choose **Vercel Authentication** (recommended) or
   **Password Protection**. Either works; Vercel
   Authentication integrates with the GitHub org and is the
   default choice for internal monorepos.
3. Save.

Without this step, the preview URL is publicly accessible
and no bypass header is required (the e2e suite still runs,
but the guard on the oRPC handler never engages).

## 2. Create a bypass secret named "Playwright tests"

In **Settings → Deployment Protection → Bypass for
Automation**:

1. Click **Create Bypass Secret**.
2. Name: `Playwright tests`.
3. Copy the generated secret value immediately — Vercel
   does not show it again.

Vercel automatically exposes this value as a system env
var named `VERCEL_AUTOMATION_BYPASS_SECRET` on every
deployment. The e2e suite reads this env var via Next.js
`headers()` to gate the test-only failure path.

Reference:
<https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation>

## 3. Mirror the secret as a GitHub Actions repository secret

In the GitHub repo **Settings → Secrets and variables →
Actions**:

1. Click **New repository secret**.
2. Name: `VERCEL_AUTOMATION_BYPASS_SECRET` (exact match).
3. Value: paste the secret from step 2.

This is the value the CI workflow passes to Playwright as
the `x-vercel-protection-bypass` request header.

## 4. Configure the GitHub App for `repository_dispatch`

The CI workflow listens on `repository_dispatch` with
event type `vercel.deployment.success`. Vercel posts this
event automatically when its GitHub App is installed on
the base repo and Deployment Protection is enabled.

Verify:

1. Repo **Settings → Integrations → GitHub Apps** →
   `Vercel` is installed and authorized.
2. Open a preview deployment; the `apps-web-e2e.yml`
   workflow fires within ~30s.

If the workflow never fires, check the Vercel dashboard
for the project under **Settings → Git** and re-authorize.

## 5. (Optional) Nightly workflow secrets

The nightly workflow
(`.github/workflows/apps-web-e2e-extended.yml`) requires
two additional GitHub Actions repository secrets:

- `NIGHTLY_PREVIEW_URL`: a long-lived preview URL
  (e.g. from a permanent `nightly` branch). The nightly
  cannot wait for a fresh PR deployment to spin up.
- (the same `VERCEL_AUTOMATION_BYPASS_SECRET` as the
  PR-blocking workflow.)

Without `NIGHTLY_PREVIEW_URL`, the nightly workflow
fails to start Playwright. The PR-blocking workflow is
unaffected.

## 6. Rotating the bypass secret

From the Vercel dashboard, **rotate** the bypass secret
when a team member with bypass access leaves the
organization, or at the team's scheduled cadence (90 days
is a sensible default).

After rotation:

1. Vercel automatically generates a new secret value.
2. The **deployed** preview runs continue to use the old
   value until a new deployment is triggered. A redeploy
   picks up the new value.
3. Update the GitHub Actions repository secret with the
   new value.
4. (Optional) Trigger a manual redeploy of the latest
   preview to make the rotation effective immediately.

The e2e suite tolerates rotation: the closed-by-default
guard means an out-of-date secret on the runner just
disables the test-only failure path (the e2e suite falls
back to hitting the real upstream).

## 7. Verifying the setup

After completing the steps above, open a draft PR. The
preview deployment should fire `apps-web-e2e.yml` within
~60s. The Playwright run asserts:

- `/templates` renders the populated catalog (P0-1).
- The error boundary renders on a forced failure (P0-3).
- The `x-nextjs-cache` header never reads `HIT` on
  `/templates` (P0-6, issue #81 regression guard).

If the workflow fails on the first run with a missing
secret error, verify the GitHub Actions secret name
matches `VERCEL_AUTOMATION_BYPASS_SECRET` exactly.