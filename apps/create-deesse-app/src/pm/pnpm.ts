import type { InstallStrategy } from "./install-strategy.js"
import type { InstallCommand, PackageManager } from "./manager.js"

export const pnpm: PackageManager = {
  id: "pnpm",
  installCommand: (
    strategy: InstallStrategy,
    version: string
  ): InstallCommand => {
    switch (strategy) {
      case "corepack":
        // Corepack reads the generated project's
        // `packageManager` field and resolves pnpm@version.
        return { bin: "corepack", args: ["pnpm", "install"] }
      case "npm-exec":
        // `npm exec` downloads pnpm@version into npm's cache
        // and runs the binary directly; no global install, no
        // PATH modification. `--yes` suppresses the confirmation
        // prompt npm may issue in interactive shells; in non-TTY
        // contexts npm's default is to install silently, but
        // `--yes` is the documented way to make the behavior
        // explicit and consistent.
        return {
          bin: "npm",
          args: ["exec", "--yes", "--", `pnpm@${version}`, "install"],
        }
      case "pnpm-direct":
        return { bin: "pnpm", args: ["install"] }
    }
  },
  lockfileName: "pnpm-lock.yaml",
  // Informational: the install command itself decides. See
  // `manager.ts` for the rationale.
  requiresCorepack: false,
}
