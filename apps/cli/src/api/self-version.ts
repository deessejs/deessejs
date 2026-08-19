// Local declaration: tsup `define` (see apps/cli/tsup.config.ts) replaces
// `process.env.CLI_PACKAGE_VERSION` with a string literal at build time.
// The field is not present on Node's actual `process.env` shape, so we
// declare it here for typechecking. The declaration is scoped to this
// file; nothing else in the CLI sees it.
declare const process: {
  env: {
    CLI_PACKAGE_VERSION: string
  }
}

/**
 * The CLI's own version, injected at build time from
 * apps/cli/package.json via tsup `define`. The bundler inlines the
 * literal string; there is no runtime lookup and no fragile
 * `import.meta.url` resolution back to package.json.
 *
 * Single source of truth: apps/cli/package.json. Changesets owns
 * the field; tsup reads it; the bundle carries it.
 *
 * See ADR-019.
 */
export const readPackageVersion = (): string => process.env.CLI_PACKAGE_VERSION
