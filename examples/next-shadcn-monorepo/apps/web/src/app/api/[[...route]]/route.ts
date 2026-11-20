import { toNextJsHandler } from "deesse/next"
import { createDeesseApp } from "../../../../deesse.config.ts"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const handler = toNextJsHandler(await createDeesseApp())

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler
export const OPTIONS = handler
