import { config as baseConfig } from "./base.js"
import { config as reactInternalConfig } from "./react-internal.js"
import pluginNext from "@next/eslint-plugin-next"
import globals from "globals"

const nextConfig = [
  ...baseConfig,
  ...reactInternalConfig,
  {
    plugins: {
      "@next/next": pluginNext,
    },
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
]

export { nextConfig }
