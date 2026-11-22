import { inferAdditionalFields } from "better-auth/client/plugins"
import { createClient as createDeesseClient, deesseClient } from "deesse/react"
import type { deesse } from "@deesse-config"

export const client = createDeesseClient({
  plugins: [deesseClient<typeof deesse>(), inferAdditionalFields<typeof deesse.auth>()],
})
