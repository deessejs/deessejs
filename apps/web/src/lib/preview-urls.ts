// Preview-aware URL helpers for `apps/web` (ADR-029 Decision #4).
//
// `withRelatedProject` from `@vercel/related-projects` reads
// `VERCEL_RELATED_PROJECTS` (auto-injected by Vercel when
// `relatedProjects` is declared in `apps/web/vercel.json`) and
// returns the linked sibling project's preview URL when
// `VERCEL_ENV === "preview"`, the production alias/url when
// `VERCEL_ENV === "production"`, or the env var fallback otherwise
// (development, missing link, malformed payload — see ADR-029
// Limitation #4 for the four `defaultHost` cases).
//
// `projectName` matches the Vercel project slug as shown in the
// dashboard (Settings → General → Project Name) and embedded in the
// preview URL (`<slug>-git-<branch>.vercel.app`). NOT the
// workspace-internal `package.json` `name` and NOT the Vercel
// Project ID (`prj_xxx`) — those are different identifiers. As of
// this commit, the slugs are `deessejs-app` and `deessejs-web`.

import { withRelatedProject } from "@vercel/related-projects"
import { clientEnv } from "@workspace/env/client"

/** API backend origin — used by the oRPC link and the Better Auth client. */
export const apiBaseUrl = withRelatedProject({
  projectName: "deessejs-app",
  defaultHost: clientEnv.NEXT_PUBLIC_API_BASE_URL,
})

/** apps/app origin — used by the header cross-app links. */
export const appUrl = withRelatedProject({
  projectName: "deessejs-app",
  defaultHost: clientEnv.NEXT_PUBLIC_APP_URL,
})

/** Marketing origin — used by apps/app when linking back to web. */
export const webUrl = withRelatedProject({
  projectName: "deessejs-web",
  defaultHost: clientEnv.NEXT_PUBLIC_WEB_URL,
})