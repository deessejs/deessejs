// Root-level ESLint flat config for a Turborepo workspace.
// App/package lint rules live in each workspace's eslint.config.js.
import { includeIgnoreFile } from "@eslint/compat"
import { dirname } from "path"
import { fileURLToPath } from "url"
import tseslint from "typescript-eslint"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const gitignorePath = includeIgnoreFile(__dirname)

/** @type {import("eslint").Linter.Config} */
export default [
  {
    ignores: ["**/.turbo/**", "**/coverage/**", "**/dist/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"],
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
]
