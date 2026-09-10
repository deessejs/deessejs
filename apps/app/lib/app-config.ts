// apps/app configuration. Local to `apps/app` — does not live in
// `@workspace/ui` (UI primitives stay pure) nor in `@workspace/env`
// (env stays narrow and Zod-validated).
//
// URL values come from `@workspace/env/client` via the ergonomic
// helpers (`webURL()`, `appURL()`) so the role-to-env-var mapping is
// single-sourced. `apps/app` self-references via `appURL()` and
// links back to marketing via `webURL()`.

import { appURL, webURL } from "@workspace/env/client"

export const APP_CONFIG = {
  name: "DeesseJS",
  description:
    "SaaS application built with Next.js and shared UI components",
  appURL: appURL(),
  webURL: webURL(),
  // Dashboard nav links (relative paths under the apps/app host).
  links: {
    home: "/home",
    login: "/login",
    signup: "/signup",
    settings: "/settings",
    device: "/device",
  },
} as const

export const APP_NAME = APP_CONFIG.name
export const APP_URL = APP_CONFIG.appURL
export const WEB_URL = APP_CONFIG.webURL

export type AppConfig = typeof APP_CONFIG