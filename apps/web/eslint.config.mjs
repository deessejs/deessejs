import { nextConfig } from "@workspace/eslint-config/next"

export default [
  ...nextConfig,
  {
    ignores: [".content-collections/**"],
  },
]
