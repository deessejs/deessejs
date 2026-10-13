import { config as baseConfig } from "@workspace/eslint-config/base"

export default [
  ...baseConfig,
  {
    // The `scripts/` directory holds Node-only helper scripts that
    // shell out to the `auth` CLI. They use Node globals (`process`,
    // `console`, `Buffer`) and are intentionally not portable to
    // edge or browser runtimes. The shared base config restricts
    // them so they cannot be inlined into the auth handler bundle
    // by accident; lint is widened here to allow them.
    files: ["scripts/**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
      },
    },
  },
  {
    ignores: ["scripts/.auth.generated.ts"],
  },
]
