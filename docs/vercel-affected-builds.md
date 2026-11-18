# Selective Vercel builds

The Vercel ignored build command keeps the production and staging environment gate, then checks the affected `build` task with Turbo 2.10.4. Pull request and other preview deployments remain skipped by the environment gate.

The ignored build step runs before dependency installation. The script therefore uses `npx --yes turbo@2.10.4`; this pins the CLI version but requires npm registry network access on a cache miss. If the query cannot run, the script continues the build.

Set each Vercel project's **Ignored Build Step** command as follows:

| Project | Root Directory | Command |
| --- | --- | --- |
| app | `apps/app` | `node ../../scripts/vercel-ignore-build.mjs app` |
| web | `apps/web` | `node ../../scripts/vercel-ignore-build.mjs web` |
| docs | `apps/docs` | `node ../../scripts/vercel-ignore-build.mjs @workspace/docs` |
| agent | `apps/agent` | `node ../../scripts/vercel-ignore-build.mjs agent` |

The command requires Vercel system environment variables to be exposed, especially `VERCEL_TARGET_ENV`, `VERCEL_GIT_PREVIOUS_SHA`, and `VERCEL_GIT_COMMIT_SHA`. The previous SHA must exist locally and be an ancestor of the deployment commit. Missing history, invalid refs, non-ancestor bases, query errors, malformed results, and changed root-level files all continue the build. The script also forces builds for root package/workspace, Turbo, TypeScript, npm, and lockfile configuration changes.

To force a manual redeploy, disable **Use project's Ignore Build Step** for that redeploy in Vercel. No Vercel project settings are changed by this repository change.

Blog posts with a future `scheduled` date are filtered during content generation and web build. Passing the scheduled time does not itself trigger a deployment, so publishing still waits for a later build. This change does not add a scheduled deployment mechanism.
