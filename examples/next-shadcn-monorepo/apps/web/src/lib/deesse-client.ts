import { createClient as createDeesseClient } from "deesse/react"
import type { deesse } from "../../deesse.config.ts"

export const createClient = () => createDeesseClient<typeof deesse>()
export const client = createClient()
