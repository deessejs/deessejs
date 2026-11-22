import { createClient, deesseServer } from "deesse/react"
import type { deesse } from "@deesse-config"

export const client = createClient({ server: deesseServer<typeof deesse>() })
