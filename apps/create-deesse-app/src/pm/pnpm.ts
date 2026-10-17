import type { PackageManager } from "./manager.js"

export const pnpm: PackageManager = {
  id: "pnpm",
  installCommand: () => ({ bin: "pnpm", args: ["install"] }),
  lockfileName: "pnpm-lock.yaml",
  requiresCorepack: true,
}