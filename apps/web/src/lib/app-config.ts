// Marketing-site configuration. Local to `apps/web` — does not live
// in `@workspace/ui` (UI primitives stay pure) nor in `@workspace/env`
// (env stays narrow and Zod-validated).
//
// URL values come from `@workspace/env/client` via the ergonomic
// helpers (`webURL()`, `appURL()`, `docsURL()`, `apiBaseURL()`) so the
// role-to-env-var mapping is single-sourced. ADR-029 Decision #1
// forbids aliasing these into the marketing canonical; the marketing
// canonical IS `NEXT_PUBLIC_WEB_URL` (exposed via `webURL()`).

import { webURL } from "@workspace/env/client"

export const APP_CONFIG = {
  name: "DeesseJS",
  description:
    "SaaS application built with Next.js and shared UI components",
  url: webURL(),
  // Marketing-site nav links (relative paths under the marketing host).
  links: {
    home: "/",
    docs: "https://docs.deessejs.com",
    changelog: "/changelog",
    blog: "/blog",
    pricing: "/pricing",
  },
} as const

export const APP_NAME = APP_CONFIG.name
export const WEB_URL = APP_CONFIG.url

export type AppConfig = typeof APP_CONFIG