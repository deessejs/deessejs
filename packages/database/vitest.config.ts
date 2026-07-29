import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["@workspace/env/server"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
    },
  },
})
