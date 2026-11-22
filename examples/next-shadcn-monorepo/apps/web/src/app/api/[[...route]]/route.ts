import { toNextJsHandler } from "deesse/next"
import { deesse } from "@deesse-config"

const handler = toNextJsHandler(deesse)

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler
export const OPTIONS = handler
