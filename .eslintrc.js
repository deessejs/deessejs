// Root-level ESLint flat config for a Turborepo workspace.
//
// ADR-031 Phase 2: ESLint is no longer the primary linter. Oxlint runs first
// (see .oxlintrc.json and pnpm run lint:oxlint). This config still runs ESLint
// for the rules that have no Oxlint equivalent — see the ESLint-only section
// of packages/eslint-config/base.js. eslint-plugin-oxlint reads .oxlintrc.json
// and auto-disables the ESLint rules that Oxlint already covers, so we don't
// have to keep the two rule sets in sync by hand.
//
// App/package lint rules live in each workspace's eslint.config.js.
import { includeIgnoreFile } from "@eslint/compat"
import { dirname } from "path"
import { fileURLToPath } from "url"
import tseslint from "typescript-eslint"
import oxlint from "eslint-plugin-oxlint"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const gitignorePath = includeIgnoreFile(__dirname)

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["**/.turbo/**", "**/coverage/**", "**/dist/**"],
  },
  // Auto-disable ESLint rules that Oxlint already covers. Reads .oxlintrc.json
  // and produces a config block that turns those rules off in this ESLint run.
  // ESLint is left to enforce the rules that Oxlint does not implement.
  ...oxlint.buildFromOxlintConfigFile(".oxlintrc.json"),
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"],
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
]
