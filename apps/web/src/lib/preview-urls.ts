// Preview-aware URL helpers for `apps/web` (ADR-028 Decision #4).
//
// `withRelatedProject` from `@vercel/related-projects` reads
// `VERCEL_RELATED_PROJECTS` (auto-injected by Vercel when
// `relatedProjects` is declared in `apps/web/vercel.json`) and
// returns the linked sibling project's preview URL when
// `VERCEL_ENV === "preview"`, the production alias/url when
// `VERCEL_ENV === "production"`, or the env var fallback otherwise
// (development, missing link, malformed payload — see ADR-028
// Limitation #4 for the four `defaultHost` cases).
//
// `projectName` matches the Vercel project name (not the
// workspace-internal `package.json` `name`). The team uses
// `apps-app` and `apps-web` per the Vercel dashboard convention
// for monorepo projects — confirm with the operator before
// shipping.

import { withRelatedProject } from "@vercel/related-projects"
import { clientEnv } from "@workspace/env/client"

/** API backend origin — used by the oRPC link and the Better Auth client. */
export const apiBaseUrl = withRelatedProject({
  projectName: "apps-app",
  defaultHost: clientEnv.NEXT_PUBLIC_API_BASE_URL,
})

/** apps/app origin — used by the header cross-app links. */
export const appUrl = withRelatedProject({
  projectName: "apps-app",
  defaultHost: clientEnv.NEXT_PUBLIC_APP_URL,
})

/** Marketing origin — used by apps/app when linking back to web. */
export const webUrl = withRelatedProject({
  projectName: "apps-web",
  defaultHost: clientEnv.NEXT_PUBLIC_WEB_URL,
})