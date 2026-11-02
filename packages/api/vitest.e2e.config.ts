import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

import type { UserConfig } from "vitest/config"

const shared = vitestConfig({
  include: ["tests/e2e/**/*.e2e.ts"],
  testTimeout: 60_000,
  hookTimeout: 30_000,
})

const config: UserConfig = {
  ...shared,
  test: {
    ...(shared.test ?? {}),
    globalSetup: "./tests/globalSetup.ts",
  },
}

export default defineConfig(config)
