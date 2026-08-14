import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

export default defineConfig(
  vitestConfig({
    coverage: {
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/dist/**",
        "**/*.d.ts",
        "src/migrations/**",
      ],
    },
  }),
)
