import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

export default defineConfig(
  vitestConfig({
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
    },
  }),
)
