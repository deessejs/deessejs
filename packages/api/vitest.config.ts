import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

import type { UserConfig } from "vitest/config"

const shared = vitestConfig({
  coverage: {
    include: ["src/**/*.ts"],
    exclude: [
      "**/*.test.ts",
      "**/dist/**",
      "**/*.d.ts",
      "src/migrations/**",
      "src/http/hono-adapter.ts",
      "src/http/mount-rpc.ts",
    ],
  },
})

// Layer the API-specific globalSetup on top of the shared config.
// `vitestConfig` does not expose `globalSetup` as an override
// (it only forwards a fixed allowlist of keys), so we add it
// here without touching the shared package.
const config: UserConfig = {
  ...shared,
  test: {
    ...(shared.test ?? {}),
    globalSetup: "./tests/globalSetup.ts",
  },
}

export default defineConfig(config)
