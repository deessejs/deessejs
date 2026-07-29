import { nextConfig } from "@workspace/eslint-config/next"

export default [
  ...nextConfig,
  {
    rules: {
      // TanStack Form uses children as render prop pattern (not React children)
      "react/no-children-prop": "off",
    },
  },
]
