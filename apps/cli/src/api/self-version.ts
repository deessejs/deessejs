/**
 * The CLI's own version, read from the package metadata at build time.
 *
 * The CLI is bundled by tsup into a single `dist/index.js`, so a
 * runtime `import.meta.url` resolution back to package.json is
 * fragile (paths differ between `npx`, global install, and direct
 * invocation). We bake the version into the bundle as a constant.
 *
 * Update this when bumping apps/cli/package.json.
 */
export const CLI_PACKAGE_VERSION = "2.0.0"

export const readPackageVersion = (): string => CLI_PACKAGE_VERSION
