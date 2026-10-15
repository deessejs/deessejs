import { internal } from "../errors/index.js"
import type { PackageManager, PackageManagerId } from "./manager.js"
import { pnpm } from "./pnpm.js"

export const SUPPORTED_MANAGERS: readonly PackageManagerId[] = ["pnpm"] as const

const REGISTRY: Record<PackageManagerId, PackageManager> = {
  pnpm,
}

export const getManager = (id: PackageManagerId): PackageManager => {
  const m = REGISTRY[id]
  if (!m) {
    throw internal(`no package manager registered for id "${id}"`)
  }
  return m
}

export type { PackageManager, PackageManagerId }