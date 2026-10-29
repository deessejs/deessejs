import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

import type { UserConfig } from "vitest/config"

const shared = vitestConfig({
  include: [
    "tests/unit/github-app-request.test.ts",
    "tests/unit/github-app-repositories.test.ts",
    "tests/unit/github-user-access-token.test.ts",
  ],
})

const config: UserConfig = {
  ...shared,
  test: {
    ...(shared.test ?? {}),
    globalSetup: [],
  },
}

export default defineConfig(config)