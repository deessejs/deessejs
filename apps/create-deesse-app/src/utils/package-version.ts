// `process.env.CREATE_DEESSE_APP_VERSION` is inlined by tsup (see
// tsup.config.ts) and vitest (see vitest.config.ts) at build/test time
// from apps/create-deesse-app/package.json. The declare block tells
// TypeScript about the extra field, which is otherwise absent from
// NodeJS.ProcessEnv. This mirrors the pattern in
// apps/cli/src/api/self-version.ts.
declare const process: {
  env: {
    CREATE_DEESSE_APP_VERSION?: string
  }
}

const FALLBACK = "0.0.0"

/**
 * Read the package version, as injected by the bundler at build time
 * (or the test runner at test time). The fallback "0.0.0" is only used
 * if both injection mechanisms ever fail to substitute — never in
 * shipped binaries. The drift-guard test
 * (test/unit/package-version.test.ts) catches a configuration
 * regression where tsup stops substituting.
 */
export const readPackageVersion = (): string => {
  return process.env.CREATE_DEESSE_APP_VERSION ?? FALLBACK
}
