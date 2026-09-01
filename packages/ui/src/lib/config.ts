// Shared app configuration — used by all apps in the workspace.
// Values come from `@workspace/env/client` so the contract is single-sourced
// and the bundler can inline NEXT_PUBLIC_* at build time.

import { clientEnv } from "@workspace/env/client"

export const APP_CONFIG = {
  name: clientEnv.NEXT_PUBLIC_APP_NAME,
  description: clientEnv.NEXT_PUBLIC_APP_DESCRIPTION,
  appURL: clientEnv.NEXT_PUBLIC_APP_URL,
  webURL: clientEnv.NEXT_PUBLIC_WEB_URL,
  docsURL: clientEnv.NEXT_PUBLIC_DOCS_URL,
  apiBaseURL: clientEnv.NEXT_PUBLIC_API_BASE_URL,
  links: {
    home: "/",
    login: "/login",
    signup: "/signup",
    settings: "/settings",
  },
} as const

// Convenience exports — each env var carries one role.
// `WEB_URL` is the marketing canonical (`deessejs.com` in prod).
// `APP_URL` is the apps/app origin (`app.deessejs.com` in prod).
// `DOCS_URL` is the docs origin (`docs.deessejs.com` in prod).
// `API_BASE_URL` is the API origin seen by clients
//   (apps/app in this repo — same as APP_URL today).
// Consumers import the role they need directly; aliasing across roles
// is forbidden by ADR-028.
export const APP_NAME = APP_CONFIG.name
export const WEB_URL = APP_CONFIG.webURL
export const APP_URL = APP_CONFIG.appURL
export const DOCS_URL = APP_CONFIG.docsURL
export const API_BASE_URL = APP_CONFIG.apiBaseURL

export type AppConfig = typeof APP_CONFIG