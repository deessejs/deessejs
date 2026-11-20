import { createClient as createDeesseClient } from "deesse/react"
import type { deesse } from "../../deesse.config.ts"

const createAppClient = createDeesseClient<typeof deesse>()

export const createClient = () => createAppClient()
export const client = createClient()
