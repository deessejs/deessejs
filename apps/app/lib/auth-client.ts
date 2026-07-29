"use client"

import { createAuthClient } from "better-auth/react"
import { clientEnv } from "@workspace/env/client"

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
})
