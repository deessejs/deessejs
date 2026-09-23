import { defineConfig } from "vitest/config"
import { vitestConfig } from "@workspace/vitest-config"

export default defineConfig(
  vitestConfig({
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "jsdom",
    coverage: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
    },
  }),
  {
    // The next-intl package internally imports `next/navigation` with a
    // `.js` extension that Vitest 4's resolver does not always handle
    // on Windows. Inline the package so Vitest transpiles it with its
    // own resolver and the import works.
    test: {
      server: {
        deps: {
          inline: ["next-intl"],
        },
      },
    },
  },
)
