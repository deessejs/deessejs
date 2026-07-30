import { config as baseConfig } from "@workspace/eslint-config/base"

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
]