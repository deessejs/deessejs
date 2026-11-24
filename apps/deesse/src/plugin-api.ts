import { os } from "@orpc/server"
import type { DeesseDatabaseSchema, DeesseRequestContext } from "./types.js"

export function createPluginApi<TSchema extends DeesseDatabaseSchema>(schema: TSchema) {
  void schema
  return os.$context<DeesseRequestContext<TSchema>>()
}
