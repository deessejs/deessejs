import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

export default defineConfig(
  vitestConfig({ testTimeout: 30000, hookTimeout: 30000, setupFiles: [] }),
)
