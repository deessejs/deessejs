// Shared app configuration — used by all apps in the workspace.
// Values come from `@workspace/env/client` so the contract is single-sourced
// and the bundler can inline NEXT_PUBLIC_* at build time.

import { clientEnv } from "@workspace/env/client"

export const APP_CONFIG = {
  name: clientEnv.NEXT_PUBLIC_APP_NAME,
  description: clientEnv.NEXT_PUBLIC_APP_DESCRIPTION,
  url: clientEnv.NEXT_PUBLIC_APP_URL,
  links: {
    home: "/",
    login: "/login",
    signup: "/signup",
    settings: "/settings",
  },
} as const

// Convenience exports
export const APP_NAME = APP_CONFIG.name
export const APP_URL = APP_CONFIG.url

export type AppConfig = typeof APP_CONFIG
