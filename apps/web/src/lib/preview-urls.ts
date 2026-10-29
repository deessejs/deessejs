// Preview-aware URL helpers for `apps/web`.
//
// `withRelatedProject` reads
// `VERCEL_RELATED_PROJECTS` (auto-injected by Vercel when
// `relatedProjects` is declared in `apps/web/vercel.json`) and
// returns the linked sibling project's deployment URL for previews,
// or its production URL in production.
//
// The custom staging environment has public domains for both apps.
// Its related-project URL is the generated `.vercel.app` alias, which
// is behind Vercel Deployment Protection. Use the app's custom staging
// domain for API calls from both the browser and server-side rendering.

import { withRelatedProject } from "@vercel/related-projects"
import { clientEnv } from "@workspace/env/client"

const STAGING_APP_URL = "https://staging-app.deessejs.com"

function resolveAppUrl(defaultHost: string): string {
  if (process.env.VERCEL_TARGET_ENV === "staging") {
    return STAGING_APP_URL
  }

  return withRelatedProject({
    projectName: "deessejs-app",
    defaultHost,
  })
}

/** API backend origin used by the oRPC link and the Better Auth client. */
export const apiBaseUrl = resolveAppUrl(clientEnv.NEXT_PUBLIC_API_BASE_URL)

/** apps/app origin used by the header cross-app links. */
export const appUrl = resolveAppUrl(clientEnv.NEXT_PUBLIC_APP_URL)

/** Marketing origin used by apps/app when linking back to web. */
export const webUrl = withRelatedProject({
  projectName: "deessejs-web",
  defaultHost: clientEnv.NEXT_PUBLIC_WEB_URL,
})
