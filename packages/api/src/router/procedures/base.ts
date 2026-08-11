import { os } from "@orpc/server"
import type { BaseContext } from "./base-context.js"

// Base procedure with shared context.
export const base = os.$context<BaseContext>()
