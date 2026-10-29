import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

import type { UserConfig } from "vitest/config"

const shared = vitestConfig({
  include: ["tests/integration/rpc/github-app.test.ts"],
})

const config: UserConfig = {
  ...shared,
  test: {
    ...(shared.test ?? {}),
    globalSetup: [],
  },
}

export default defineConfig(config)
